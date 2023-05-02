/*
 * GDevelop JS Platform
 * Copyright 2013-2016 Florian Rival (Florian.Rival@gmail.com). All rights reserved.
 * This project is released under the MIT License.
 */

namespace gdjs {
  import PIXI = GlobalPIXIModule.PIXI;

  const logger = new gdjs.Logger('LayerPixiRenderer');

  /**
   * The renderer for a gdjs.Layer using Pixi.js.
   */
  export class LayerPixiRenderer {
    private _pixiContainer: PIXI.Container;

    private _layer: gdjs.RuntimeLayer;

    /** For a lighting layer, the sprite used to display the render texture. */
    private _lightingSprite: PIXI.Sprite | null = null;
    private _isLightingLayer: boolean;
    private _clearColor: Array<integer>;

    /**
     * The render texture where the whole 2D layer is rendered.
     * The render texture is then used for lighting (if it's a light layer)
     * or to be rendered in a 3D scene (for a 2D+3D layer).
     */
    private _renderTexture: PIXI.RenderTexture | null = null;

    // Width and height are tracked when a render texture is used.
    private _oldWidth: float | null = null;
    private _oldHeight: float | null = null;

    // For a 3D (or 2D+3D) layer:
    private _threeGroup: THREE.Group | null = null;
    private _threeScene: THREE.Scene | null = null;
    private _threeCamera: THREE.PerspectiveCamera | null = null;
    private _threeCameraDirty: boolean = false;

    // For a 2D+3D layer, the 2D rendering is done on the render texture
    // and then must be displayed on a plane in the 3D world:
    private _threePlaneTexture: THREE.Texture | null = null;
    private _threePlaneGeometry: THREE.PlaneGeometry | null = null;
    private _threePlaneMaterial: THREE.MeshBasicMaterial | null = null;
    private _threePlaneMesh: THREE.Mesh | null = null;

    /**
     * Pixi doesn't sort children with zIndex == 0.
     */
    private static readonly zeroZOrderForPixi = Math.pow(2, -24);

    /**
     * @param layer The layer
     * @param runtimeInstanceContainerRenderer The scene renderer
     */
    constructor(
      layer: gdjs.RuntimeLayer,
      runtimeInstanceContainerRenderer: gdjs.RuntimeInstanceContainerRenderer,
      runtimeGameRenderer: gdjs.RuntimeGameRenderer
    ) {
      this._pixiContainer = new PIXI.Container();
      this._pixiContainer.sortableChildren = true;
      this._layer = layer;
      this._isLightingLayer = layer.isLightingLayer();
      this._clearColor = layer.getClearColor();
      runtimeInstanceContainerRenderer
        .getRendererObject()
        .addChild(this._pixiContainer);
      this._pixiContainer.filters = [];

      // Setup rendering for lighting or 3D rendering:
      const pixiRenderer = runtimeGameRenderer.getPIXIRenderer();
      if (this._isLightingLayer) {
        this._setupLightingRendering(
          pixiRenderer,
          runtimeInstanceContainerRenderer
        );
      } else {
        this._setup3dRendering(pixiRenderer, runtimeInstanceContainerRenderer);
      }
    }

    getRendererObject(): PIXI.Container {
      return this._pixiContainer;
    }

    getThreeScene(): THREE.Scene | null {
      return this._threeScene;
    }

    getThreeCamera(): THREE.PerspectiveCamera | null {
      return this._threeCamera;
    }

    /**
     * The sprite, displaying the "render texture" of the layer, to display
     * for a lighting layer.
     */
    getLightingSprite(): PIXI.Sprite | null {
      return this._lightingSprite;
    }

    /**
     * Create, or re-create, Three.js objects for 3D rendering of this layer.
     */
    private _setup3dRendering(
      pixiRenderer: PIXI.Renderer | null,
      runtimeInstanceContainerRenderer: gdjs.RuntimeInstanceContainerRenderer
    ): void {
      // TODO (3D): ideally we would avoid the need for this check at all,
      // maybe by having separate rendering classes for custom object layers and scene layers.
      if (this._layer instanceof gdjs.Layer) {
        if (
          this._layer.getRenderingType() ===
            gdjs.RuntimeLayerRenderingType.THREE_D ||
          this._layer.getRenderingType() ===
            gdjs.RuntimeLayerRenderingType.TWO_D_PLUS_THREE_D
        ) {
          if (this._threeScene || this._threeGroup || this._threeCamera) {
            throw new Error(
              'Tried to setup 3D rendering for a layer that is already set up.'
            );
          }

          this._threeScene = new THREE.Scene();

          // Use a mirroring on the Y axis to follow the same axis as in the 2D, PixiJS, rendering.
          // We use a mirroring rather than a camera rotation so that the Z order is not changed.
          this._threeScene.scale.y = -1;

          this._threeGroup = new THREE.Group();
          this._threeScene.add(this._threeGroup);

          this._threeCamera = new THREE.PerspectiveCamera(
            this._layer.getInitialThreeDFieldOfView(),
            1,
            this._layer.getInitialThreeDNearPlaneDistance(),
            this._layer.getInitialThreeDFarPlaneDistance()
          );
          this._threeCamera.rotation.order = 'ZYX';

          if (
            this._layer.getRenderingType() ===
            gdjs.RuntimeLayerRenderingType.TWO_D_PLUS_THREE_D
          ) {
            if (
              this._renderTexture ||
              this._threePlaneGeometry ||
              this._threePlaneMaterial ||
              this._threePlaneTexture ||
              this._threePlaneMesh
            )
              throw new Error(
                'Tried to setup PixiJS plane for 2D rendering in 3D for a layer that is already set up.'
              );

            // If we have both 2D and 3D objects to be rendered, create a render texture that PixiJS will use
            // to render, and that will be projected on a plane by Three.js
            this._createPixiRenderTexture(pixiRenderer);

            // Create the plane that will show this texture.
            this._threePlaneGeometry = new THREE.PlaneGeometry(1, 1);
            this._threePlaneMaterial = new THREE.MeshBasicMaterial({
              side: THREE.FrontSide,
              transparent: true,
            });

            // Create the texture to project on the plane.
            // Use a buffer to create a "fake" DataTexture, just so the texture
            // is considered initialized by Three.js.
            const width = 1;
            const height = 1;
            const size = width * height;
            const data = new Uint8Array(4 * size);
            const texture = new THREE.DataTexture(data, width, height);
            texture.needsUpdate = true;

            this._threePlaneTexture = texture;
            this._threePlaneTexture.generateMipmaps = false;
            this._threePlaneTexture.minFilter = THREE.LinearFilter;
            this._threePlaneTexture.wrapS = THREE.ClampToEdgeWrapping;
            this._threePlaneTexture.wrapT = THREE.ClampToEdgeWrapping;
            this._threePlaneMaterial.map = this._threePlaneTexture;

            // Finally, create the mesh shown in the scene.
            this._threePlaneMesh = new THREE.Mesh(
              this._threePlaneGeometry,
              this._threePlaneMaterial
            );
            this._threeScene.add(this._threePlaneMesh);
          }
        }

        this.onGameResolutionResized();
      } else {
        // This is a layer of a custom object.

        const parentThreeObject = runtimeInstanceContainerRenderer.get3dRendererObject();
        if (!parentThreeObject) {
          // No parent 3D renderer object, 3D is disabled.
          return;
        }

        if (!this._threeGroup) {
          // TODO (3D) - optimization: do not create a THREE.Group if no 3D object are contained inside.
          this._threeGroup = new THREE.Group();
          parentThreeObject.add(this._threeGroup);
        }
      }
    }

    setThreeCameraDirty(enable: boolean) {
      this._threeCameraDirty = enable;
    }

    onGameResolutionResized() {
      if (this._threeCamera) {
        this._threeCamera.aspect =
          this._layer.getWidth() / this._layer.getHeight();
        this._threeCamera.updateProjectionMatrix();

        this.updatePosition();
      }
    }

    /**
     * Update the position of the PIXI container. To be called after each change
     * made to position, zoom or rotation of the camera.
     */
    updatePosition(): void {
      const angle = -gdjs.toRad(this._layer.getCameraRotation());
      const zoomFactor = this._layer.getCameraZoom();
      this._pixiContainer.rotation = angle;
      this._pixiContainer.scale.x = zoomFactor;
      this._pixiContainer.scale.y = zoomFactor;
      const cosValue = Math.cos(angle);
      const sinValue = Math.sin(angle);
      const centerX =
        this._layer.getCameraX() * zoomFactor * cosValue -
        this._layer.getCameraY() * zoomFactor * sinValue;
      const centerY =
        this._layer.getCameraX() * zoomFactor * sinValue +
        this._layer.getCameraY() * zoomFactor * cosValue;
      this._pixiContainer.position.x = this._layer.getWidth() / 2 - centerX;
      this._pixiContainer.position.y = this._layer.getHeight() / 2 - centerY;

      if (
        this._layer.getRuntimeScene().getGame().getPixelsRounding() &&
        (cosValue === 0 || sinValue === 0) &&
        Number.isInteger(zoomFactor)
      ) {
        // Camera rounding is important for pixel perfect games.
        // Otherwise, the camera position fractional part is added to
        // the sprite one and it changes in which direction sprites are rounded.
        // It makes sprites rounding inconsistent with each other
        // and they seem to move on pixel left and right.
        //
        // PIXI uses a floor function on sprites position on the screen,
        // so a floor must be applied on the camera position too.
        // According to the above calculus,
        // _pixiContainer.position is the opposite of the camera,
        // this is why the ceil function is used floor(x) = -ceil(-x).
        //
        // When the camera directly follows an object,
        // given this object dimension is even,
        // the decimal part of onScenePosition and cameraPosition are the same.
        //
        // Doing the calculus without rounding:
        // onScreenPosition = onScenePosition - cameraPosition
        // onScreenPosition = 980.75 - 200.75
        // onScreenPosition = 780
        //
        // Doing the calculus with rounding:
        // onScreenPosition = floor(onScenePosition + ceil(-cameraPosition))
        // onScreenPosition = floor(980.75 + ceil(-200.75))
        // onScreenPosition = floor(980.75 - 200)
        // onScreenPosition = floor(780.75)
        // onScreenPosition = 780
        this._pixiContainer.position.x = Math.ceil(
          this._pixiContainer.position.x
        );
        this._pixiContainer.position.y = Math.ceil(
          this._pixiContainer.position.y
        );
      }

      if (this._threeCamera) {
        // TODO (3D) - improvement: handle camera rounding like down for PixiJS?
        this._threeCamera.position.x = this._layer.getCameraX();
        this._threeCamera.position.y = -this._layer.getCameraY(); // Inverted because the scene is mirrored on Y axis.
        this._threeCamera.rotation.z = angle;

        // Set the camera so that it displays the whole PixiJS plane, as if it was a 2D rendering.
        // The Z position is computed by taking the half height of the displayed rendering,
        // and using the angle of the triangle defined by the field of view to compute the length
        // of the triangle defining the distance between the camera and the rendering plane.
        const cameraFovInRadians = gdjs.toRad(this._threeCamera.fov);
        const cameraZPosition =
          (0.5 * this._layer.getHeight()) /
          zoomFactor /
          Math.tan(0.5 * cameraFovInRadians);
        this._threeCamera.position.z = cameraZPosition;

        if (this._threePlaneMesh) {
          // Adapt the plane size so that it covers the whole screen.
          this._threePlaneMesh.scale.x = this._layer.getWidth() / zoomFactor;
          this._threePlaneMesh.scale.y = this._layer.getHeight() / zoomFactor;

          // Adapt the plane position so that it's always displayed on the whole screen.
          this._threePlaneMesh.position.x = this._threeCamera.position.x;
          this._threePlaneMesh.position.y = -this._threeCamera.position.y; // Inverted because the scene is mirrored on Y axis.
          this._threePlaneMesh.rotation.z = -angle;
        }
      }
    }

    updateVisibility(visible: boolean): void {
      this._pixiContainer.visible = !!visible;
      if (this._threeGroup) this._threeGroup.visible = !!visible;
    }

    updatePreRender(): void {
      if (this._threeCameraDirty) {
        const camera = this.getThreeCamera();
        if (camera) {
          camera.updateProjectionMatrix();
        }
        this._threeCameraDirty = false;
      }
    }

    /**
     * Add a child to the pixi container associated to the layer.
     * All objects which are on this layer must be children of this container.
     *
     * @param pixiChild The child (PIXI object) to be added.
     * @param zOrder The z order of the associated object.
     */
    addRendererObject(pixiChild, zOrder: float): void {
      const child = pixiChild as PIXI.DisplayObject;
      child.zIndex = zOrder || LayerPixiRenderer.zeroZOrderForPixi;
      this._pixiContainer.addChild(child);
    }

    /**
     * Change the z order of a child associated to an object.
     *
     * @param pixiChild The child (PIXI object) to be modified.
     * @param newZOrder The z order of the associated object.
     */
    changeRendererObjectZOrder(pixiChild, newZOrder: float): void {
      const child = pixiChild as PIXI.DisplayObject;
      child.zIndex = newZOrder;
    }

    /**
     * Remove a child from the internal pixi container.
     * Should be called when an object is deleted or removed from the layer.
     *
     * @param child The child (PIXI object) to be removed.
     */
    removeRendererObject(child): void {
      this._pixiContainer.removeChild(child);
    }

    add3dRendererObject(object: THREE.Object3D) {
      if (!this._threeGroup) return;

      this._threeGroup.add(object);
    }

    remove3dRendererObject(object: THREE.Object3D): void {
      if (!this._threeGroup) return;

      this._threeGroup.remove(object);
    }

    updateClearColor(): void {
      this._clearColor = this._layer.getClearColor();
      // this._createPixiRenderTexture(); // TODO: Check this was useless
    }

    /**
     * Create the PixiJS RenderTexture used to display the whole layer.
     * Can be used either for lighting or for rendering the layer in a texture
     * so it can then be consumed by Three.js to render it in 3D.
     */
    private _createPixiRenderTexture(pixiRenderer: PIXI.Renderer | null): void {
      if (!pixiRenderer || pixiRenderer.type !== PIXI.RENDERER_TYPE.WEBGL) {
        return;
      }
      if (this._renderTexture) {
        logger.error(
          'Tried to create a PixiJS RenderTexture for a layer that already has one.'
        );
        return;
      }

      this._oldWidth = pixiRenderer.screen.width;
      this._oldHeight = pixiRenderer.screen.height;
      const width = this._oldWidth;
      const height = this._oldHeight;
      const resolution = pixiRenderer.resolution;
      this._renderTexture = PIXI.RenderTexture.create({
        width,
        height,
        resolution,
      });
      this._renderTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
      logger.info(`RenderTexture created for layer ${this._layer.getName()}.`);
    }

    /**
     * Render the layer of the PixiJS RenderTexture, so that it can be then displayed
     * with a blend mode (for a lighting layer) or consumed by Three.js (for 2D+3D layers).
     */
    renderOnPixiRenderTexture(pixiRenderer: PIXI.Renderer) {
      if (!this._renderTexture) {
        return;
      }
      if (
        this._oldWidth !== pixiRenderer.screen.width ||
        this._oldHeight !== pixiRenderer.screen.height
      ) {
        this._renderTexture.resize(
          pixiRenderer.screen.width,
          pixiRenderer.screen.height
        );
        this._oldWidth = pixiRenderer.screen.width;
        this._oldHeight = pixiRenderer.screen.height;
      }
      const oldRenderTexture = pixiRenderer.renderTexture.current;
      const oldSourceFrame = pixiRenderer.renderTexture.sourceFrame;
      pixiRenderer.renderTexture.bind(this._renderTexture);

      // The background is the ambient color for lighting layers
      // and transparent for 2D+3D layers.
      this._clearColor[3] = this._isLightingLayer ? 1 : 0;
      pixiRenderer.renderTexture.clear(this._clearColor);

      pixiRenderer.render(this._pixiContainer, {
        renderTexture: this._renderTexture,
        clear: false,
      });
      pixiRenderer.renderTexture.bind(
        oldRenderTexture,
        oldSourceFrame,
        undefined
      );
    }

    /**
     * Set the texture of the 2D plane in the 3D world to be the same WebGL texture
     * as the PixiJS RenderTexture - so that the 2D rendering can be shown in the 3D world.
     */
    updateThreePlaneTextureFromPixiRenderTexture(
      threeRenderer: THREE.WebGLRenderer,
      pixiRenderer: PIXI.Renderer
    ): void {
      if (!this._threePlaneTexture || !this._renderTexture) {
        return;
      }

      const glTexture = this._renderTexture.baseTexture._glTextures[
        pixiRenderer.CONTEXT_UID
      ];
      if (glTexture) {
        // "Hack" into the Three.js renderer by getting the internal WebGL texture for the PixiJS plane,
        // and set it so that it's the same as the WebGL texture for the PixiJS RenderTexture.
        // This works because PixiJS and Three.js are using the same WebGL context.
        const texture = threeRenderer.properties.get(this._threePlaneTexture);
        texture.__webglTexture = glTexture.texture;
      }
    }

    /**
     * Enable the use of a PIXI.RenderTexture to render the PIXI.Container
     * of the layer and, in the scene PIXI container, replace the container
     * of the layer by a sprite showing this texture.
     * used only in lighting for now as the sprite could have MULTIPLY blend mode.
     */
    private _setupLightingRendering(
      pixiRenderer: PIXI.Renderer | null,
      runtimeInstanceContainerRenderer: gdjs.RuntimeInstanceContainerRenderer
    ): void {
      this._createPixiRenderTexture(pixiRenderer);
      if (!this._renderTexture) {
        return;
      }

      this._lightingSprite = new PIXI.Sprite(this._renderTexture);
      this._lightingSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
      const parentPixiContainer = runtimeInstanceContainerRenderer.getRendererObject();
      const index = parentPixiContainer.getChildIndex(this._pixiContainer);
      parentPixiContainer.addChildAt(this._lightingSprite, index);
      parentPixiContainer.removeChild(this._pixiContainer);
    }
  }

  //Register the class to let the engine use it.
  export type LayerRenderer = gdjs.LayerPixiRenderer;
  export const LayerRenderer = gdjs.LayerPixiRenderer;
}
