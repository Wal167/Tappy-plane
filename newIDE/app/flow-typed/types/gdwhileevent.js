// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
declare class gdWhileEvent {
  constructor(): void;
  getConditions(): gdInstructionsList;
  getWhileConditions(): gdInstructionsList;
  getActions(): gdInstructionsList;
  clone(): gdWhileEvent;
  getType(): string;
  setType(type: string): void;
  isExecutable(): boolean;
  canHaveSubEvents(): boolean;
  hasSubEvents(): boolean;
  getSubEvents(): gdEventsList;
  isDisabled(): boolean;
  setDisabled(disable: boolean): void;
  isFolded(): boolean;
  setFolded(folded: boolean): void;
  serializeTo(element: gdSerializerElement): void;
  unserializeFrom(project: gdProject, element: gdSerializerElement): void;
  delete(): void;
  ptr: number;
};