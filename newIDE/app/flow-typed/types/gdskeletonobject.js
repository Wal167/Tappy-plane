// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
declare class gdSkeletonObject {
  constructor(name: string): void;
  setName(name: string): void;
  getName(): string;
  setType(type: string): void;
  getType(): string;
  setTags(tags: string): void;
  getTags(): string;
  getProperties(project: gdProject): gdMapStringPropertyDescriptor;
  updateProperty(name: string, value: string, project: gdProject): boolean;
  getInitialInstanceProperties(instance: gdInitialInstance, project: gdProject, scene: gdLayout): gdMapStringPropertyDescriptor;
  updateInitialInstanceProperty(instance: gdInitialInstance, name: string, value: string, project: gdProject, scene: gdLayout): boolean;
  exposeResources(worker: gdArbitraryResourceWorker): void;
  getVariables(): gdVariablesContainer;
  getAllBehaviorNames(): gdVectorString;
  hasBehaviorNamed(name: string): boolean;
  addNewBehavior(project: gdProject, type: string, name: string): gdBehaviorContent;
  getBehavior(name: string): gdBehaviorContent;
  removeBehavior(name: string): void;
  renameBehavior(oldBame: string, name: string): boolean;
  serializeTo(element: gdSerializerElement): void;
  unserializeFrom(project: gdProject, element: gdSerializerElement): void;
  delete(): void;
  ptr: number;
};