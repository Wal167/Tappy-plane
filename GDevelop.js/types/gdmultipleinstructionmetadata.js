// Automatically generated by GDevelop.js/scripts/generate-types.js
declare class gdMultipleInstructionMetadata {
  addParameter(type: string, description: string, optionalObjectType?: string, parameterIsOptional?: boolean): gdMultipleInstructionMetadata;
  addCodeOnlyParameter(type: string, supplementaryInformation: string): gdMultipleInstructionMetadata;
  setDefaultValue(defaultValue: string): gdMultipleInstructionMetadata;
  setParameterLongDescription(longDescription: string): gdMultipleInstructionMetadata;
  setParameterExtraInfo(extraInfo: string): gdMultipleInstructionMetadata;
  useStandardParameters(type: string, typeExtraInfo?: string): gdMultipleInstructionMetadata;
  setHidden(): gdMultipleInstructionMetadata;
  setFunctionName(functionName: string): gdMultipleInstructionMetadata;
  setGetter(getter: string): gdMultipleInstructionMetadata;
  setIncludeFile(includeFile: string): gdMultipleInstructionMetadata;
  addIncludeFile(includeFile: string): gdMultipleInstructionMetadata;
  getIncludeFiles(): gdVectorString;
  markAsSimple(): gdMultipleInstructionMetadata;
  markAsAdvanced(): gdMultipleInstructionMetadata;
  markAsComplex(): gdMultipleInstructionMetadata;
  setPrivate(): gdMultipleInstructionMetadata;
  delete(): void;
  ptr: number;
};