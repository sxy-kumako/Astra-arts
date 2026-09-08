"""Export the latest native scene for Pages; batch static geometry by collection/material."""
import bpy
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'blender/phase-13.blend'))
scene=bpy.context.scene;scene.frame_set(1)
web=bpy.data.collections.new('WebExport');scene.collection.children.link(web)
selected=[];deps=bpy.context.evaluated_depsgraph_get()
animated={'13_CharacterSample','14_CharacterCoral','15_CharacterSage','16_FallingPetals','17_Fireworks','18_Meteors'}
names=[c.name for c in scene.collection.children if c.name[:2].isdigit()]
for name in names:
    group=bpy.data.objects.new('Layer_'+name,None);web.objects.link(group);selected.append(group)
    group['layer']=name
    if name in animated:
        objects=list(bpy.data.collections[name].objects)
        for obj in objects:
            if obj.parent is None:obj.parent=group
        selected.extend(objects)
        continue
    buckets={}
    for obj in bpy.data.collections[name].objects:
        if obj.type not in ('MESH','CURVE','FONT'):continue
        if name=='10_Stage' and not (obj.name.startswith('DistantMountain') or obj.name=='Moon_Crescent'):continue
        evaluated=obj.evaluated_get(deps);mesh=evaluated.to_mesh()
        for polygon in mesh.polygons:
            material=obj.material_slots[polygon.material_index].material
            vertices,faces=buckets.setdefault(material,([],[]));base=len(vertices)
            vertices.extend(tuple(evaluated.matrix_world @ mesh.vertices[i].co) for i in polygon.vertices)
            faces.append(tuple(range(base,base+len(polygon.vertices))))
        evaluated.to_mesh_clear()
    for material,(vertices,faces) in buckets.items():
        data=bpy.data.meshes.new(name+'_'+material.name);data.from_pydata(vertices,[],faces);data.update();data.materials.append(material)
        obj=bpy.data.objects.new(data.name,data);web.objects.link(obj);obj.parent=group;selected.append(obj)

bpy.ops.object.select_all(action='DESELECT')
for obj in selected:obj.select_set(True)
# Frame 481 closes the 480-frame loop. This exports an exact 20-second clip.
scene.frame_end=481
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/summer-festival-phase13.glb'),export_format='GLB',
    use_selection=True,export_extras=True,export_cameras=False,export_lights=False,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_anim_slide_to_zero=True,export_anim_scene_split_object=False,
    export_force_sampling=True,export_frame_step=2,export_optimize_animation_size=True,
    export_skins=True,export_morph=False,export_yup=True)
print('WEB_EXPORT_DONE',str(ROOT/'assets/summer-festival-phase13.glb'))
