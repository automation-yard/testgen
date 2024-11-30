export type ExportType = "default" | "named" | "unknown";

export interface Method {
  name: string;
  code: string;
}

export interface BundlerResult {
  inputFileCode: string;
  dependenciesCode: string;
  inputFileImports: string[];
  dependenciesImports: string[];
  methods: Method[];
  message?: string;
  isJavaScript: boolean;
  exportType: ExportType;
  classImportStatements: string[];
}
