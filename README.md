# Panoramo viewer

Project started as a vanilla Typescript project using: https://vitejs.dev/guide/

Three.js scene initialization started with: https://threejs.org/docs/#manual/en/introduction/Installation

# Development

Developed in part with GitHub copilot

Thanks to: https://en.wikipedia.org/wiki/Equirectangular_projection and https://en.wikipedia.org/wiki/360_video_projection

Thanks to: https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html to help with the blur in the fragment shader.

# Approach

The blur uses a scaled down version of the framebuffer (hence using RenderTargets)
And there is a fragment shader which does some extra sampling, though the scaling down makes this potentially not necessary.
Zoom / Rotate happen by rotating the sphere, the camera is always facing down the negative Z axis, this can make it
a bit tricky to convert screen space points to work, then to the space of the sphere. Potentially this needs a rework.

# Deploy

1. Run `npm run build`
2. Check out the `nzjony.github.io` repository: `git clone git@github.com:nzjony/nzjony.github.io.git`
3. Copy the output of step 1 (i.e. the contents of `dist`) and put this in the root directory of the repository in step 2. Commit and push to GitHub
4. Changes should be visible at: https://nzjony.github.io/

# Todo
- add eslint
- auto deploy to nzjony github
- add prettier
- many bugs, only one blur supported

# Demo
![Panoramo Viewer Demo](./PanoramoViewerDemo.mp4)
