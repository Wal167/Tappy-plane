// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
declare class gdBehaviorMetadata {
  getName(): string;
  getFullName(): string;
  getDefaultName(): string;
  getDescription(): string;
  getGroup(): string;
  getIconFilename(): string;
  getHelpPath(): string;
  addScopedCondition(name: string, fullname: string, description: string, sentence: string, group: string, icon: string, smallicon: string): gdInstructionMetadata;
  addScopedAction(name: string, fullname: string, description: string, sentence: string, group: string, icon: string, smallicon: string): gdInstructionMetadata;
  addCondition(name: string, fullname: string, description: string, sentence: string, group: string, icon: string, smallicon: string): gdInstructionMetadata;
  addAction(name: string, fullname: string, description: string, sentence: string, group: string, icon: string, smallicon: string): gdInstructionMetadata;
  addExpression(name: string, fullname: string, description: string, group: string, smallicon: string): gdExpressionMetadata;
  addStrExpression(name: string, fullname: string, description: string, group: string, smallicon: string): gdExpressionMetadata;
  setIncludeFile(includeFile: string): gdBehaviorMetadata;
  addIncludeFile(includeFile: string): gdBehaviorMetadata;
  setObjectType(objectType: string): gdBehaviorMetadata;
  getObjectType(): string;
  get(): gdBehavior;
  getSharedDataInstance(): gdBehaviorsSharedData;
  delete(): void;
  ptr: number;
};