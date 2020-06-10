// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
declare class gdPlatformExtension {
  constructor(): void;
  setExtensionInformation(name: string, fullname: string, description: string, author: string, license: string): gdPlatformExtension;
  setExtensionHelpPath(helpPath: string): gdPlatformExtension;
  markAsDeprecated(): void;
  addCondition(name: string, fullname: string, description: string, sentence: string, group: string, icon: string, smallicon: string): gdInstructionMetadata;
  addAction(name: string, fullname: string, description: string, sentence: string, group: string, icon: string, smallicon: string): gdInstructionMetadata;
  addExpression(name: string, fullname: string, description: string, group: string, smallicon: string): gdExpressionMetadata;
  addStrExpression(name: string, fullname: string, description: string, group: string, smallicon: string): gdExpressionMetadata;
  addBehavior(name: string, fullname: string, defaultName: string, description: string, group: string, icon24x24: string, className: string, instance: gdBehavior, sharedDatasInstance: gdBehaviorsSharedData): gdBehaviorMetadata;
  addObject(name: string, fullname: string, description: string, icon24x24: string, instance: gdObject): gdObjectMetadata;
  addEffect(name: string): gdEffectMetadata;
  getFullName(): string;
  getName(): string;
  getDescription(): string;
  getAuthor(): string;
  getLicense(): string;
  getHelpPath(): string;
  isBuiltin(): boolean;
  getNameSpace(): string;
  getExtensionObjectsTypes(): gdVectorString;
  getBehaviorsTypes(): gdVectorString;
  getExtensionEffectTypes(): gdVectorString;
  getObjectMetadata(type: string): gdObjectMetadata;
  getBehaviorMetadata(type: string): gdBehaviorMetadata;
  getEffectMetadata(type: string): gdEffectMetadata;
  getAllEvents(): gdMapStringEventMetadata;
  getAllActions(): gdMapStringInstructionMetadata;
  getAllConditions(): gdMapStringInstructionMetadata;
  getAllExpressions(): gdMapStringExpressionMetadata;
  getAllStrExpressions(): gdMapStringExpressionMetadata;
  getAllActionsForObject(objectType: string): gdMapStringInstructionMetadata;
  getAllConditionsForObject(objectType: string): gdMapStringInstructionMetadata;
  getAllExpressionsForObject(objectType: string): gdMapStringExpressionMetadata;
  getAllStrExpressionsForObject(objectType: string): gdMapStringExpressionMetadata;
  getAllActionsForBehavior(autoType: string): gdMapStringInstructionMetadata;
  getAllConditionsForBehavior(autoType: string): gdMapStringInstructionMetadata;
  getAllExpressionsForBehavior(autoType: string): gdMapStringExpressionMetadata;
  getAllStrExpressionsForBehavior(autoType: string): gdMapStringExpressionMetadata;
  static getNamespaceSeparator(): string;
  delete(): void;
  ptr: number;
};