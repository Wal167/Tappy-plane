/*!
 * @pixi/filter-bulge-pinch - v2.7.0
 * Compiled Sun, 13 Jan 2019 22:51:52 UTC
 *
 * @pixi/filter-bulge-pinch is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
!function(e,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports,require("pixi.js")):"function"==typeof define&&define.amd?define(["exports","pixi.js"],n):n((e=e||self).__filters={},e.PIXI)}(this,function(e,n){"use strict";var t="attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n}",r="uniform float radius;\nuniform float strength;\nuniform vec2 center;\nuniform sampler2D uSampler;\nvarying vec2 vTextureCoord;\n\nuniform vec4 filterArea;\nuniform vec4 filterClamp;\nuniform vec2 dimensions;\n\nvoid main()\n{\n    vec2 coord = vTextureCoord * filterArea.xy;\n    coord -= center * dimensions.xy;\n    float distance = length(coord);\n    if (distance < radius) {\n        float percent = distance / radius;\n        if (strength > 0.0) {\n            coord *= mix(1.0, smoothstep(0.0, radius / distance, percent), strength * 0.75);\n        } else {\n            coord *= mix(1.0, pow(percent, 1.0 + strength * 0.75) * radius / distance, 1.0 - percent);\n        }\n    }\n    coord += center * dimensions.xy;\n    coord /= filterArea.xy;\n    vec2 clampedCoord = clamp(coord, filterClamp.xy, filterClamp.zw);\n    vec4 color = texture2D(uSampler, clampedCoord);\n    if (coord != clampedCoord) {\n        color *= max(0.0, 1.0 - length(coord - clampedCoord));\n    }\n\n    gl_FragColor = color;\n}\n",o=function(e){function n(n,o,i){e.call(this,t,r),this.uniforms.dimensions=new Float32Array(2),this.center=n||[.5,.5],this.radius="number"==typeof o?o:100,this.strength="number"==typeof i?i:1}e&&(n.__proto__=e),n.prototype=Object.create(e&&e.prototype),n.prototype.constructor=n;var o={radius:{configurable:!0},strength:{configurable:!0},center:{configurable:!0}};return n.prototype.apply=function(e,n,t,r){this.uniforms.dimensions[0]=n.sourceFrame.width,this.uniforms.dimensions[1]=n.sourceFrame.height,e.applyFilter(this,n,t,r)},o.radius.get=function(){return this.uniforms.radius},o.radius.set=function(e){this.uniforms.radius=e},o.strength.get=function(){return this.uniforms.strength},o.strength.set=function(e){this.uniforms.strength=e},o.center.get=function(){return this.uniforms.center},o.center.set=function(e){this.uniforms.center=e},Object.defineProperties(n.prototype,o),n}(n.Filter);e.BulgePinchFilter=o,Object.defineProperty(e,"__esModule",{value:!0})}),Object.assign(PIXI.filters,this?this.__filters:__filters);
//# sourceMappingURL=filter-bulge-pinch.js.map
