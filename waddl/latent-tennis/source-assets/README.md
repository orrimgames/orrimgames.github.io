# LATENT source-asset extract

This folder contains the redistributable Unitree G1 MJCF + tennis geometry used by the browser court demo. It was extracted from the official LATENT repository:
https://github.com/GalaxyGeneralRobotics/LATENT

Included:
- `g1_mjx_w_racket_wo_ball.xml` - 29-DoF Unitree G1 MJCF with racket attachment
- `scene_mjx_racket_wo_ball_flat_terrain.xml` - MuJoCo scene wrapper
- `assets/tennis/entire_visual.STL` - tennis-racket visual mesh
- `LICENSE` - upstream BSD-3-Clause license
- `README.md` - upstream model provenance

The browser animation on the public page is an honest visual twin, not a MuJoCo policy rollout. The official repository has not yet released its high-level tennis policy or sim-to-real controller as of 2026-09-21; its README lists those items as TODOs.
