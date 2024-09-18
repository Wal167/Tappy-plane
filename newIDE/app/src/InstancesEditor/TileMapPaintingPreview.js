// @flow

import * as PIXI from 'pixi.js-legacy';
import getObjectByName from '../Utils/GetObjectByName';
import InstancesSelection from './InstancesSelection';
import PixiResourcesLoader from '../ObjectsRendering/PixiResourcesLoader';
import ViewPosition from './ViewPosition';
import RenderedInstance from '../ObjectsRendering/Renderers/RenderedInstance';
import Rendered3DInstance from '../ObjectsRendering/Renderers/Rendered3DInstance';
import { type TileMapTileSelection } from './TileSetVisualizer';
import { AffineTransformation } from '../Utils/AffineTransformation';

type TileSet = {|
  rowCount: number,
  columnCount: number,
  tileSize: number,
  atlasImage: string,
|};

export const updateSceneToTileMapTransformation = (
  instance: gdInitialInstance,
  renderedInstance: {
    +getEditableTileMap: () => any,
    +getCenterX: () => number,
    +getCenterY: () => number,
  },
  sceneToTileMapTransformation: AffineTransformation,
  tileMapToSceneTransformation: AffineTransformation
): ?{ scaleX: number, scaleY: number } => {
  // TODO: Do not re-calculate if instance angle, position, dimensions and ptr are the same?
  let scaleX = 1,
    scaleY = 1;
  if (instance.hasCustomSize()) {
    const editableTileMap = renderedInstance.getEditableTileMap();
    if (editableTileMap) {
      scaleX = instance.getCustomWidth() / editableTileMap.getWidth();
      scaleY = instance.getCustomHeight() / editableTileMap.getHeight();
    } else {
      console.error(
        `Could not find the editable tile map for instance of object ${instance.getObjectName()}. Make sure the tile map object is correctly configured.`
      );
      // Do not early return on error to make the preview still working to not give
      // a sense of something broken.
    }
  }
  const absScaleX = Math.abs(scaleX);
  const absScaleY = Math.abs(scaleY);

  tileMapToSceneTransformation.setToIdentity();

  // Translation
  tileMapToSceneTransformation.translate(instance.getX(), instance.getY());

  // Rotation
  const angleInRadians = (instance.getAngle() * Math.PI) / 180;
  if (angleInRadians) {
    tileMapToSceneTransformation.rotateAround(
      angleInRadians,
      renderedInstance.getCenterX(),
      renderedInstance.getCenterY()
    );
  }

  // Scale
  tileMapToSceneTransformation.scale(absScaleX, absScaleY);

  sceneToTileMapTransformation.copyFrom(tileMapToSceneTransformation);
  sceneToTileMapTransformation.invert();
  return { scaleX, scaleY };
};

export const getTileSet = (object: gdObject): TileSet => {
  const objectConfigurationProperties = object
    .getConfiguration()
    .getProperties();
  const columnCount = parseFloat(
    objectConfigurationProperties.get('columnCount').getValue()
  );
  const rowCount = parseFloat(
    objectConfigurationProperties.get('rowCount').getValue()
  );
  const tileSize = parseFloat(
    objectConfigurationProperties.get('tileSize').getValue()
  );
  const atlasImage = objectConfigurationProperties.get('atlasImage').getValue();
  return { rowCount, columnCount, tileSize, atlasImage };
};

export const isTileSetBadlyConfigured = ({
  rowCount,
  columnCount,
  tileSize,
  atlasImage,
}: TileSet) => {
  return (
    !Number.isInteger(columnCount) ||
    columnCount <= 0 ||
    !Number.isInteger(rowCount) ||
    rowCount <= 0
  );
};

/**
 * Returns the list of tiles corresponding to the user selection.
 * If only one coordinate is present, only one tile is placed at the slot the
 * pointer points to.
 * If two coordinates are present, tiles are displayed to form a rectangle with the
 * two coordinates being the top left and bottom right corner of the rectangle.
 */
export const getTilesGridCoordinatesFromPointerSceneCoordinates = ({
  coordinates,
  tileSize,
  sceneToTileMapTransformation,
}: {|
  coordinates: Array<{| x: number, y: number |}>,
  tileSize: number,
  sceneToTileMapTransformation: AffineTransformation,
|}): Array<{| x: number, y: number |}> => {
  if (coordinates.length === 0) return [];

  const tilesCoordinatesInTileMapGrid = [];

  if (coordinates.length === 1) {
    const coordinatesInTileMapGrid = [0, 0];
    sceneToTileMapTransformation.transform(
      [coordinates[0].x, coordinates[0].y],
      coordinatesInTileMapGrid
    );
    coordinatesInTileMapGrid[0] = Math.floor(
      coordinatesInTileMapGrid[0] / tileSize
    );
    coordinatesInTileMapGrid[1] = Math.floor(
      coordinatesInTileMapGrid[1] / tileSize
    );
    tilesCoordinatesInTileMapGrid.push({
      x: coordinatesInTileMapGrid[0],
      y: coordinatesInTileMapGrid[1],
    });
  }
  if (coordinates.length === 2) {
    const firstPointCoordinatesInTileMap = [0, 0];
    sceneToTileMapTransformation.transform(
      [coordinates[0].x, coordinates[0].y],
      firstPointCoordinatesInTileMap
    );
    const secondPointCoordinatesInTileMap = [0, 0];
    sceneToTileMapTransformation.transform(
      [coordinates[1].x, coordinates[1].y],
      secondPointCoordinatesInTileMap
    );
    const topLeftCornerCoordinatesInTileMap = [
      Math.min(
        firstPointCoordinatesInTileMap[0],
        secondPointCoordinatesInTileMap[0]
      ),
      Math.min(
        firstPointCoordinatesInTileMap[1],
        secondPointCoordinatesInTileMap[1]
      ),
    ];
    const bottomRightCornerCoordinatesInTileMap = [
      Math.max(
        firstPointCoordinatesInTileMap[0],
        secondPointCoordinatesInTileMap[0]
      ),
      Math.max(
        firstPointCoordinatesInTileMap[1],
        secondPointCoordinatesInTileMap[1]
      ),
    ];
    const topLeftCornerCoordinatesInTileMapGrid = [
      Math.floor(topLeftCornerCoordinatesInTileMap[0] / tileSize),
      Math.floor(topLeftCornerCoordinatesInTileMap[1] / tileSize),
    ];
    const bottomRightCornerCoordinatesInTileMapGrid = [
      Math.floor(bottomRightCornerCoordinatesInTileMap[0] / tileSize),
      Math.floor(bottomRightCornerCoordinatesInTileMap[1] / tileSize),
    ];

    for (
      let columnIndex = topLeftCornerCoordinatesInTileMapGrid[0];
      columnIndex <= bottomRightCornerCoordinatesInTileMapGrid[0];
      columnIndex++
    ) {
      for (
        let rowIndex = topLeftCornerCoordinatesInTileMapGrid[1];
        rowIndex <= bottomRightCornerCoordinatesInTileMapGrid[1];
        rowIndex++
      ) {
        tilesCoordinatesInTileMapGrid.push({ x: columnIndex, y: rowIndex });
      }
    }
  }
  return tilesCoordinatesInTileMapGrid;
};

type Props = {|
  project: gdProject,
  layout: gdLayout | null,
  instancesSelection: InstancesSelection,
  getCoordinatesToRender: () => {| x: number, y: number |}[],
  getTileMapTileSelection: () => ?TileMapTileSelection,
  getRendererOfInstance: gdInitialInstance =>
    | RenderedInstance
    | Rendered3DInstance
    | null,
  viewPosition: ViewPosition,
|};

class TileMapPaintingPreview {
  project: gdProject;
  layout: gdLayout | null;
  instancesSelection: InstancesSelection;
  getCoordinatesToRender: () => {| x: number, y: number |}[];
  getTileMapTileSelection: () => ?TileMapTileSelection;
  getRendererOfInstance: gdInitialInstance =>
    | RenderedInstance
    | Rendered3DInstance
    | null;
  toCanvasCoordinates: (x: number, y: number) => [number, number];
  viewPosition: ViewPosition;
  cache: Map<string, PIXI.Texture>;
  sceneToTileMapTransformation: AffineTransformation;
  tileMapToSceneTransformation: AffineTransformation;

  preview: PIXI.Container;

  constructor({
    instancesSelection,
    getCoordinatesToRender,
    project,
    layout,
    getTileMapTileSelection,
    getRendererOfInstance,
    viewPosition,
  }: Props) {
    this.project = project;
    this.layout = layout;
    this.instancesSelection = instancesSelection;
    this.getCoordinatesToRender = getCoordinatesToRender;
    this.getTileMapTileSelection = getTileMapTileSelection;
    this.getRendererOfInstance = getRendererOfInstance;
    this.viewPosition = viewPosition;
    this.preview = new PIXI.Container();
    this.cache = new Map();
    this.sceneToTileMapTransformation = new AffineTransformation();
    this.tileMapToSceneTransformation = new AffineTransformation();
  }

  getPixiObject(): PIXI.Container {
    return this.preview;
  }

  _getTextureInAtlas({
    tileSet,
    x,
    y,
  }: {
    tileSet: TileSet,
    x: number,
    y: number,
  }): ?PIXI.Texture {
    const { atlasImage, tileSize } = tileSet;
    if (!atlasImage) return;
    const cacheKey = `${atlasImage}-${tileSize}-${x}-${y}`;
    const cachedTexture = this.cache.get(cacheKey);
    if (cachedTexture) return cachedTexture;

    const atlasTexture = PixiResourcesLoader.getPIXITexture(
      this.project,
      atlasImage
    );

    const rect = new PIXI.Rectangle(
      x * tileSize,
      y * tileSize,
      tileSize,
      tileSize
    );

    try {
      const texture = new PIXI.Texture(atlasTexture, rect);
      this.cache.set(cacheKey, texture);
    } catch (error) {
      console.error(`Tile could not be extracted from atlas texture:`, error);
      return PixiResourcesLoader.getInvalidPIXITexture();
    }
  }

  _getTilingSpriteWithSingleTexture({
    instance,
    tileSet,
    isBadlyConfigured,
    tileMapTileSelection,
  }: {
    instance: gdInitialInstance,
    tileSet: TileSet,
    isBadlyConfigured: boolean,
    tileMapTileSelection: TileMapTileSelection,
  }) {
    const { tileSize } = tileSet;
    let texture;
    if (isBadlyConfigured) {
      texture = PixiResourcesLoader.getInvalidPIXITexture();
    } else {
      if (tileMapTileSelection.kind === 'single') {
        texture = this._getTextureInAtlas({
          tileSet,
          ...tileMapTileSelection.coordinates,
        });
        if (!texture) return;
      } else if (tileMapTileSelection.kind === 'erase') {
        texture = PIXI.Texture.from(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAARSURBVHgBY7h58+Z/BhgAcQA/VAcVLiw46wAAAABJRU5ErkJggg=='
        );
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
      }
    }

    const renderedInstance = this.getRendererOfInstance(instance);
    if (
      !renderedInstance ||
      // $FlowFixMe - TODO: Replace this check with a `instanceof RenderedSimpleTileMapInstance`
      !renderedInstance.getEditableTileMap
    ) {
      console.error(
        `Instance of ${instance.getObjectName()} seems to not be a RenderedSimpleTileMapInstance (method getEditableTileMap does not exist).`
      );
      return;
    }

    const scales = updateSceneToTileMapTransformation(
      instance,
      // $FlowFixMe
      renderedInstance,
      this.sceneToTileMapTransformation,
      this.tileMapToSceneTransformation
    );
    if (!scales) return;
    const { scaleX, scaleY } = scales;
    const coordinates = this.getCoordinatesToRender();
    if (coordinates.length === 0) return;
    const tileSizeInCanvas = this.viewPosition.toCanvasScale(tileSize);
    const spriteWidth = tileSizeInCanvas * scaleX;
    const spriteHeight = tileSizeInCanvas * scaleY;

    const spritesCoordinatesInTileMapGrid = getTilesGridCoordinatesFromPointerSceneCoordinates(
      {
        coordinates,
        tileSize,
        sceneToTileMapTransformation: this.sceneToTileMapTransformation,
      }
    );
    if (spritesCoordinatesInTileMapGrid.length === 0) {
      console.warn("Could't get coordinates to render in tile map grid.");
      return;
    }

    const workingPoint = [0, 0];

    const sprite = new PIXI.TilingSprite(texture);

    sprite.tileScale.x =
      (tileMapTileSelection.flipHorizontally ? -1 : +1) *
      this.viewPosition.toCanvasScale(scaleX);
    sprite.tileScale.y =
      (tileMapTileSelection.flipVertically ? -1 : +1) *
      this.viewPosition.toCanvasScale(scaleY);
    sprite.width = spriteWidth;
    sprite.height = spriteHeight;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const { x, y } of spritesCoordinatesInTileMapGrid) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    this.tileMapToSceneTransformation.transform(
      [minX * tileSize, minY * tileSize],
      workingPoint
    );

    sprite.x = this.viewPosition.toCanvasScale(workingPoint[0]);
    sprite.y = this.viewPosition.toCanvasScale(workingPoint[1]);
    sprite.width =
      (maxX - minX + 1) * this.viewPosition.toCanvasScale(tileSize) * scaleX;
    sprite.height =
      (maxY - minY + 1) * this.viewPosition.toCanvasScale(tileSize) * scaleY;

    sprite.angle = instance.getAngle();

    return sprite;
  }

  render() {
    this.preview.removeChildren(0);
    const tileMapTileSelection = this.getTileMapTileSelection();
    if (!tileMapTileSelection) {
      return;
    }
    const selection = this.instancesSelection.getSelectedInstances();
    if (selection.length !== 1) return;
    const instance = selection[0];
    const associatedObjectName = instance.getObjectName();
    const object = getObjectByName(
      this.project.getObjects(),
      this.layout ? this.layout.getObjects() : null,
      associatedObjectName
    );
    if (!object || object.getType() !== 'TileMap::SimpleTileMap') return;
    const tileSet = getTileSet(object);
    const isBadlyConfigured = isTileSetBadlyConfigured(tileSet);

    if (
      isBadlyConfigured ||
      tileMapTileSelection.kind === 'single' ||
      tileMapTileSelection.kind === 'erase'
    ) {
      const sprite = this._getTilingSpriteWithSingleTexture({
        instance,
        tileSet,
        tileMapTileSelection,
        isBadlyConfigured,
      });
      this.preview.addChild(sprite);
    }

    const canvasCoordinates = this.viewPosition.toCanvasCoordinates(0, 0);
    this.preview.position.x = canvasCoordinates[0];
    this.preview.position.y = canvasCoordinates[1];
  }
}

export default TileMapPaintingPreview;
