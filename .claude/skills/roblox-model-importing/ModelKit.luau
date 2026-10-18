--[[
	ModelKit (v0 - rascunho, ainda não testado no Studio)

	Pós-importação de modelos: rig (Motor6D/Welds), VFX/SFX disparados por
	Animation Markers ou Keyframes nomeados, brilho de raridade, onda de choque
	e otimização. Instale como ModuleScript em ReplicatedStorage.Shared.ModelKit.

	Edição (Command Bar ou MCP run_code):
		local MK = require(game.ReplicatedStorage.Shared.ModelKit)
		print(MK.inspect(workspace.Dragon_Fire))
		print(MK.setup(workspace.Dragon_Fire, { kind = "creature", rarity = "Mythic" }))

	Runtime (um único LocalScript em StarterPlayerScripts):
		require(game.ReplicatedStorage.Shared.ModelKit).autoBind()

	Convenções completas: SKILL.md (mesma pasta).
]]

local CollectionService = game:GetService("CollectionService")
local Debris = game:GetService("Debris")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local ModelKit = {}

ModelKit.TAG = "MK_FX"

-- Edite aqui quando o GDD fechar os nomes de raridade.
ModelKit.Rarities = {
	Common = { color = Color3.fromRGB(190, 190, 190), light = 0 },
	Uncommon = { color = Color3.fromRGB(90, 230, 110), light = 0 },
	Rare = { color = Color3.fromRGB(60, 150, 255), light = 1 },
	Epic = { color = Color3.fromRGB(170, 80, 255), light = 1.5 },
	Legendary = { color = Color3.fromRGB(255, 190, 40), light = 2 },
	Mythic = { color = Color3.fromRGB(255, 60, 90), light = 3 },
	Secret = { color = Color3.fromRGB(255, 255, 255), light = 3 },
	["???"] = { color = Color3.fromRGB(40, 0, 60), light = 3 },
}

-- Efeitos ligados por um tempo (atributo Duration) quando o marker dispara.
local TOGGLE_CLASSES = {
	Trail = true,
	Beam = true,
	PointLight = true,
	SpotLight = true,
	SurfaceLight = true,
	Fire = true,
	Smoke = true,
	Sparkles = true,
}

-- Precisam de BasePart como pai (não funcionam dentro de Attachment).
local NEEDS_PART = { Fire = true, Smoke = true, Sparkles = true }

local function findRoot(model)
	if model:IsA("Model") and model.PrimaryPart then
		return model.PrimaryPart
	end
	local root = model:FindFirstChild("HumanoidRootPart") or model:FindFirstChild("Handle") or model:FindFirstChild("Root")
	if not (root and root:IsA("BasePart")) then
		local bestVolume = -1
		root = nil
		for _, d in model:GetDescendants() do
			if d:IsA("BasePart") then
				local s = d.Size
				local volume = s.X * s.Y * s.Z
				if volume > bestVolume then
					root, bestVolume = d, volume
				end
			end
		end
	end
	if root and model:IsA("Model") then
		model.PrimaryPart = root
	end
	return root
end

local function findAnimator(owner)
	return owner:FindFirstChildWhichIsA("Animator", true)
end

local function ensureAnimator(model)
	local host = model:FindFirstChildOfClass("Humanoid") or model:FindFirstChildOfClass("AnimationController")
	if not host then
		host = Instance.new("AnimationController")
		host.Parent = model
	end
	local animator = host:FindFirstChildOfClass("Animator")
	if not animator then
		animator = Instance.new("Animator")
		animator.Parent = host
	end
	return animator
end

local function jointedParts(model)
	local set = {}
	for _, d in model:GetDescendants() do
		if d:IsA("JointInstance") or d:IsA("WeldConstraint") then
			if d.Part0 then
				set[d.Part0] = true
			end
			if d.Part1 then
				set[d.Part1] = true
			end
		end
	end
	return set
end

local function findAttachment(model, name)
	local a = name and model:FindFirstChild(name, true)
	if a and a:IsA("Attachment") then
		return a
	end
	return nil
end

local function extentsSize(model, root)
	if model:IsA("Model") then
		return model:GetExtentsSize().Magnitude
	end
	return root.Size.Magnitude
end

-- Motor6D com pivô no Attachment "RigJoint" da peça filha (ou no centro dela).
local function motor(parent, child)
	local pivot = child:FindFirstChild("RigJoint")
	local jointCFrame = if pivot and pivot:IsA("Attachment") then pivot.WorldCFrame else child.CFrame
	local m = Instance.new("Motor6D")
	m.Name = child.Name
	m.Part0 = parent
	m.Part1 = child
	m.C0 = parent.CFrame:ToObjectSpace(jointCFrame)
	m.C1 = child.CFrame:ToObjectSpace(jointCFrame)
	m.Parent = parent
	child.Anchored = false
	return m
end

-- Rig "estrela": toda peça vira Motor6D ligado ao root, ou à peça indicada no
-- atributo RigParent (para hierarquia: asa -> ponta da asa). Peças com
-- atributo Static = true ficam de fora e recebem solda depois.
function ModelKit.rig(model, root)
	local count = 0
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") and d ~= root and not d:GetAttribute("Static") then
			local parentName = d:GetAttribute("RigParent")
			local parent = parentName and model:FindFirstChild(parentName, true) or root
			if not parent:IsA("BasePart") then
				parent = root
			end
			motor(parent, d)
			count += 1
		end
	end
	return count
end

-- Solda ao root toda peça que ainda não tem nenhuma junta (idempotente).
function ModelKit.weld(model, root)
	local jointed = jointedParts(model)
	local count = 0
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") and d ~= root and not jointed[d] then
			local w = Instance.new("WeldConstraint")
			w.Name = "MK_Weld"
			w.Part0 = root
			w.Part1 = d
			w.Parent = d
			d.Anchored = false
			d.Massless = true
			count += 1
		end
	end
	return count
end

-- Move o conteúdo de model.FX/<Grupo> para a âncora e marca com FXGroup.
local function organizeFX(model, root)
	local folder = model:FindFirstChild("FX")
	if not folder then
		return
	end
	for _, group in folder:GetChildren() do
		local anchorName = group:GetAttribute("Anchor")
		local anchor = anchorName and model:FindFirstChild(anchorName, true)
		if not (anchor and (anchor:IsA("Attachment") or anchor:IsA("BasePart"))) then
			anchor = root
		end
		local attachment = anchor
		if anchor:IsA("BasePart") then
			attachment = anchor:FindFirstChild("MK_FX") or Instance.new("Attachment")
			attachment.Name = "MK_FX"
			attachment.Parent = anchor
		end
		local part = if attachment.Parent and attachment.Parent:IsA("BasePart") then attachment.Parent else root

		for _, fx in group:GetChildren() do
			fx:SetAttribute("FXGroup", group.Name)
			if fx:IsA("Trail") or fx:IsA("Beam") then
				fx.Attachment0 = findAttachment(model, fx:GetAttribute("A0")) or fx.Attachment0
				fx.Attachment1 = findAttachment(model, fx:GetAttribute("A1")) or fx.Attachment1
			end
			if fx:IsA("ParticleEmitter") or TOGGLE_CLASSES[fx.ClassName] then
				fx.Enabled = false
			end
			if fx:IsA("Sound") then
				local sfxGroup = game:GetService("SoundService"):FindFirstChild("SFX")
				if sfxGroup and sfxGroup:IsA("SoundGroup") then
					fx.SoundGroup = sfxGroup
				end
			end
			fx.Parent = if NEEDS_PART[fx.ClassName] then part else attachment
		end
	end
	folder:Destroy()
end

function ModelKit.applyRarity(model, root, rarity)
	local r = ModelKit.Rarities[rarity]
	if not r then
		return false
	end
	model:SetAttribute("Rarity", rarity)
	-- PointLight em vez de Highlight: Highlight tem limite de 31 simultâneos.
	if r.light > 0 then
		local light = root:FindFirstChild("MK_RarityLight") or Instance.new("PointLight")
		light.Name = "MK_RarityLight"
		light.Color = r.color
		light.Brightness = r.light
		light.Range = math.clamp(extentsSize(model, root), 8, 24)
		light.Shadows = false
		light.Parent = root
	end
	-- Aura opcional pronta em ReplicatedStorage.VFXLibrary.Aura_<Raridade>.
	local library = ReplicatedStorage:FindFirstChild("VFXLibrary")
	local aura = library and library:FindFirstChild("Aura_" .. rarity)
	if aura and not root:FindFirstChild("MK_Aura") then
		local attachment = Instance.new("Attachment")
		attachment.Name = "MK_Aura"
		attachment.Parent = root
		for _, child in aura:GetChildren() do
			child:Clone().Parent = attachment
		end
	end
	return true
end

function ModelKit.optimize(model, kind, root)
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			local s = d.Size
			if math.max(s.X, s.Y, s.Z) < 2 then
				d.CastShadow = false
			end
			if kind ~= "prop" and d ~= root then
				d.CanCollide = false
				d.CanTouch = false
			end
			if d:IsA("MeshPart") then
				local fidelity = if kind == "prop" then Enum.CollisionFidelity.Hull else Enum.CollisionFidelity.Box
				pcall(function()
					d.CollisionFidelity = fidelity
				end)
			end
		end
	end
	if model:IsA("Model") and kind ~= "prop" then
		pcall(function()
			model.ModelStreamingMode = Enum.ModelStreamingMode.Atomic
		end)
	end
end

-- Resumo curto do modelo, para não precisar ler a árvore inteira via MCP.
function ModelKit.inspect(model)
	local c = { parts = 0, meshes = 0, bones = 0, motors = 0, welds = 0, anims = 0, sounds = 0, emitters = 0, scripts = 0 }
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			c.parts += 1
			if d:IsA("MeshPart") then
				c.meshes += 1
			end
		elseif d:IsA("Bone") then
			c.bones += 1
		elseif d:IsA("Motor6D") then
			c.motors += 1
		elseif d:IsA("Weld") or d:IsA("WeldConstraint") then
			c.welds += 1
		elseif d:IsA("Animation") then
			c.anims += 1
		elseif d:IsA("Sound") then
			c.sounds += 1
		elseif d:IsA("ParticleEmitter") then
			c.emitters += 1
		elseif d:IsA("LuaSourceContainer") then
			c.scripts += 1
		end
	end
	local root = findRoot(model)
	local fx = model:FindFirstChild("FX")
	return string.format(
		"%s [%s] root=%s size=%.1f parts=%d meshes=%d bones=%d motors=%d welds=%d anims=%d sounds=%d emitters=%d scripts=%d fxGroups=%d animator=%s",
		model.Name,
		model.ClassName,
		root and root.Name or "NONE",
		root and extentsSize(model, root) or 0,
		c.parts,
		c.meshes,
		c.bones,
		c.motors,
		c.welds,
		c.anims,
		c.sounds,
		c.emitters,
		c.scripts,
		fx and #fx:GetChildren() or 0,
		tostring(findAnimator(model) ~= nil)
	)
end

-- kind: "prop" | "weapon" | "creature" | "pet". Retorna relatório de 1 linha.
-- stripScripts = true remove todos os scripts (obrigatório em modelos grátis da Creator Store).
function ModelKit.setup(model, opts)
	opts = opts or {}
	local kind = opts.kind or (if model:IsA("Tool") then "weapon" else "prop")
	local root = findRoot(model)
	assert(root, "ModelKit: modelo sem BasePart")
	local report = { model.Name, "kind=" .. kind, "root=" .. root.Name }

	if opts.stripScripts then
		local removed = 0
		for _, d in model:GetDescendants() do
			if d:IsA("LuaSourceContainer") then
				d:Destroy()
				removed += 1
			end
		end
		table.insert(report, "scriptsRemovidos=" .. removed)
	end

	if kind == "prop" then
		for _, d in model:GetDescendants() do
			if d:IsA("BasePart") then
				d.Anchored = true
			end
		end
	elseif kind == "weapon" then
		table.insert(report, "welds=" .. ModelKit.weld(model, root))
		root.Anchored = false
		root.CanCollide = false
	else
		local skinned = model:FindFirstChildWhichIsA("Bone", true) ~= nil
		local hasRig = model:FindFirstChildWhichIsA("Motor6D", true) ~= nil
		local motors = if skinned or hasRig then 0 else ModelKit.rig(model, root)
		table.insert(report, "motors=" .. motors .. (if skinned then " (skinned)" elseif hasRig then " (rig existente)" else ""))
		table.insert(report, "welds=" .. ModelKit.weld(model, root))
		root.Anchored = opts.anchored ~= false
		ensureAnimator(model)
	end

	organizeFX(model, root)
	local fxCount = 0
	for _, d in model:GetDescendants() do
		if d:GetAttribute("FXGroup") then
			fxCount += 1
		end
	end
	if fxCount > 0 then
		CollectionService:AddTag(model, ModelKit.TAG)
	end
	table.insert(report, "fx=" .. fxCount)

	if opts.rarity then
		table.insert(report, "rarity=" .. (if ModelKit.applyRarity(model, root, opts.rarity) then opts.rarity else "INVALIDA"))
	end
	ModelKit.optimize(model, kind, root)
	return table.concat(report, " | ")
end

-- Onda de choque em expansão (disco Neon que cresce e some).
function ModelKit.shockwave(cframe, color, radius, duration)
	local ring = Instance.new("Part")
	ring.Name = "MK_Shockwave"
	ring.Shape = Enum.PartType.Cylinder
	ring.Anchored = true
	ring.CanCollide = false
	ring.CanTouch = false
	ring.CanQuery = false
	ring.CastShadow = false
	ring.Material = Enum.Material.Neon
	ring.Color = color
	ring.Size = Vector3.new(0.2, 1, 1)
	ring.CFrame = cframe * CFrame.Angles(0, 0, math.rad(90))
	ring.Parent = workspace
	local info = TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	TweenService:Create(ring, info, { Size = Vector3.new(0.2, radius * 2, radius * 2), Transparency = 1 }):Play()
	Debris:AddItem(ring, duration)
end

local function trigger(items, param)
	for _, fx in items do
		if fx:IsA("ParticleEmitter") then
			fx:Emit(tonumber(param) or fx:GetAttribute("EmitCount") or 15)
		elseif fx:IsA("Sound") then
			if fx:GetAttribute("Overlap") then
				local s = fx:Clone()
				s.Parent = fx.Parent
				s:Play()
				s.Ended:Once(function()
					s:Destroy()
				end)
				Debris:AddItem(s, 10)
			else
				fx:Play()
			end
		elseif fx:IsA("Configuration") and fx.Name == "Shockwave" then
			local origin = fx.Parent
			local cframe = if origin:IsA("Attachment") then origin.WorldCFrame elseif origin:IsA("BasePart") then origin.CFrame else nil
			if cframe then
				ModelKit.shockwave(
					cframe,
					fx:GetAttribute("Color") or Color3.new(1, 1, 1),
					fx:GetAttribute("Radius") or 12,
					fx:GetAttribute("Duration") or 0.4
				)
			end
		elseif TOGGLE_CLASSES[fx.ClassName] then
			fx.Enabled = true
			task.delay(fx:GetAttribute("Duration") or 0.35, function()
				fx.Enabled = false
			end)
		end
	end
end

-- Liga os grupos de FX de `owner` aos markers/keyframes das animações tocadas
-- em `animator` (padrão: o Animator do próprio owner). Para armas, passe o
-- Animator do personagem. Retorna função de limpeza.
function ModelKit.bindFX(owner, animator)
	animator = animator or findAnimator(owner)
	local groups = {}
	for _, d in owner:GetDescendants() do
		local name = d:GetAttribute("FXGroup")
		if name then
			groups[name] = groups[name] or {}
			table.insert(groups[name], d)
		end
	end
	if not animator or next(groups) == nil then
		return function() end
	end

	local trackConnections = {}

	local function unhook(track)
		local conns = trackConnections[track]
		if conns then
			for _, c in conns do
				c:Disconnect()
			end
			trackConnections[track] = nil
		end
	end

	local function hook(track)
		if trackConnections[track] then
			return
		end
		local conns = {}
		for name, items in groups do
			table.insert(conns, track:GetMarkerReachedSignal(name):Connect(function(param)
				trigger(items, param)
			end))
		end
		table.insert(conns, track.KeyframeReached:Connect(function(keyframeName)
			local items = groups[keyframeName]
			if items then
				trigger(items)
			end
		end))
		table.insert(conns, track.Stopped:Once(function()
			unhook(track)
		end))
		trackConnections[track] = conns
	end

	for _, track in animator:GetPlayingAnimationTracks() do
		hook(track)
	end
	local played = animator.AnimationPlayed:Connect(hook)

	return function()
		played:Disconnect()
		for track in trackConnections do
			unhook(track)
		end
	end
end

-- Cliente: liga FX automaticamente em todo modelo com a tag MK_FX que aparecer
-- (compatível com StreamingEnabled). Ferramentas ligam ao personagem que as segura.
function ModelKit.autoBind()
	local cleanups = {}

	local function release(inst)
		if cleanups[inst] then
			cleanups[inst]()
			cleanups[inst] = nil
		end
	end

	local function attach(inst)
		release(inst)
		if inst:IsA("Tool") then
			local humanoid = inst.Parent and inst.Parent:FindFirstChildOfClass("Humanoid")
			local animator = humanoid and humanoid:FindFirstChildOfClass("Animator")
			if animator then
				cleanups[inst] = ModelKit.bindFX(inst, animator)
			end
		else
			cleanups[inst] = ModelKit.bindFX(inst)
		end
	end

	local function onAdded(inst)
		attach(inst)
		if inst:IsA("Tool") then
			inst.AncestryChanged:Connect(function()
				attach(inst)
			end)
		end
	end

	for _, inst in CollectionService:GetTagged(ModelKit.TAG) do
		onAdded(inst)
	end
	CollectionService:GetInstanceAddedSignal(ModelKit.TAG):Connect(onAdded)
	CollectionService:GetInstanceRemovedSignal(ModelKit.TAG):Connect(release)
end

-- Toca uma animação da pasta model.Animations, reaproveitando a track.
local trackCache = setmetatable({}, { __mode = "k" })

function ModelKit.play(model, animationName, fadeTime)
	local animator = findAnimator(model)
	local folder = model:FindFirstChild("Animations")
	local animation = folder and folder:FindFirstChild(animationName)
	if not (animator and animation and animation:IsA("Animation")) then
		return nil
	end
	local cache = trackCache[animator]
	if not cache then
		cache = {}
		trackCache[animator] = cache
	end
	local track = cache[animationName]
	if not track then
		track = animator:LoadAnimation(animation)
		cache[animationName] = track
	end
	track:Play(fadeTime)
	return track
end

return ModelKit
