export const CLAUDE_PROMPT = `TASK: Convert the input 2D floor plan into a photorealistic, top-down 3D architectural render.

Return a structured JSON object describing every room, wall, door, window, and furniture item detected.

STRICT REQUIREMENTS (do not violate):
1) REMOVE ALL TEXT: Do not render letters, numbers, labels, dimensions, or annotations.
2) GEOMETRY MUST MATCH: Walls, rooms, doors, and windows must follow the exact lines and positions.
3) TOP-DOWN ONLY: Orthographic top-down view. No perspective tilt.
4) CLEAN, REALISTIC OUTPUT: Crisp edges, balanced lighting, realistic materials.
5) NO EXTRA CONTENT: Do not add rooms, furniture, or objects not clearly indicated by the plan.

STRUCTURE & DETAILS:
- Walls: Extrude precisely from plan lines. Consistent height (2.8m) and thickness (0.15m).
- Doors: Convert door swing arcs into open doors aligned to the plan.
- Windows: Convert thin perimeter lines into realistic glass windows.

FURNITURE MAPPING (only where icons/fixtures are clearly shown):
- Bed icon → bed (dimensions ~1.6 x 2.0m)
- Sofa icon → sofa (dimensions ~2.2 x 0.9m)
- Dining table icon → table (dimensions ~1.5 x 0.8m)
- Kitchen → counters with sink and stove
- Bathroom → toilet, sink, and tub/shower
- Office → desk (~1.4 x 0.7m) and chair
- Washer/dryer → washer (~0.6 x 0.6m)

TEXTURES & MATERIALS:
- Hardwood floors in living areas and bedrooms
- Tile in kitchens and bathrooms
- Carpet in defined lounge areas
- White or off-white painted walls (#F5F5F0)
- Matte ceiling finish

COORDINATE SYSTEM:
- All positions in meters from the building origin (0, 0, 0)
- x = horizontal axis (left to right)
- z = depth axis (front to back)
- y = height (0 = floor level)

OUTPUT FORMAT: Return ONLY valid JSON. No markdown, no backticks, no explanation outside JSON.

{
  "rooms": [
    {
      "id": "room_1",
      "type": "bedroom",
      "label": "Master Bedroom",
      "position": { "x": 0, "y": 0, "z": 0 },
      "dimensions": { "width": 4.2, "height": 3.0, "depth": 3.8 },
      "floor_material": "hardwood",
      "wall_color": "#F5F5F0",
      "furniture": [
        {
          "type": "bed",
          "position": { "x": 1.0, "y": 0, "z": 1.5 },
          "rotation": 0,
          "dimensions": { "width": 1.6, "depth": 2.0 }
        }
      ]
    }
  ],
  "walls": [
    {
      "id": "wall_1",
      "start": { "x": 0, "z": 0 },
      "end": { "x": 4.2, "z": 0 },
      "height": 2.8,
      "thickness": 0.15
    }
  ],
  "doors": [
    {
      "id": "door_1",
      "wall_id": "wall_1",
      "position": { "x": 1.5, "z": 0 },
      "width": 0.9,
      "swing": "left"
    }
  ],
  "windows": [
    {
      "id": "window_1",
      "wall_id": "wall_1",
      "position": { "x": 2.8, "z": 0 },
      "width": 1.2,
      "height": 1.0,
      "sill_height": 0.9
    }
  ],
  "total_area_sqm": 85.4,
  "building_type": "residential",
  "estimated_scale": "1:50"
}`
