export const vertexShader = `
varying vec2 vUv;
void main()
{
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;


export const fragmentShader = `
uniform sampler2D tDiffuse;
varying vec2 vUv;
uniform vec2 u_textureSize;
void main()
{
	vec4 color = texture2D(tDiffuse, vUv);
	// apply from neighbouring pixels

	// From: https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

	vec4 left = texture2D(tDiffuse, vUv + vec2(-onePixel.x, 0.0));
	vec4 right = texture2D(tDiffuse, vUv + vec2(onePixel.x, 0.0));
	vec4 top = texture2D(tDiffuse, vUv + vec2(0.0, onePixel.y));
	vec4 bottom = texture2D(tDiffuse, vUv + vec2(0.0, -onePixel.y));
	vec4 topLeft = texture2D(tDiffuse, vUv + vec2(-onePixel.x, onePixel.y));
	vec4 topRight = texture2D(tDiffuse, vUv + vec2(onePixel.x, onePixel.y));
	vec4 bottomLeft = texture2D(tDiffuse, vUv + vec2(-onePixel.x, -onePixel.y));
	vec4 bottomRight = texture2D(tDiffuse, vUv + vec2(onePixel.x, -onePixel.y));

	color = (color + left + right + top + bottom + topLeft + topRight + bottomLeft + bottomRight) / 9.0;
	gl_FragColor = color;
}
`;
