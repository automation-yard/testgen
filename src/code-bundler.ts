import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

export class CodeBundler {
  private visitedFiles: Set<string> = new Set();
  private entryFilePath: string;
  private methodName: string;

  constructor(private entryFile: string, methodName?: string) {
    this.entryFilePath = path.resolve(entryFile);
    this.methodName = methodName || "";
  }

  public bundle(): {
    inputFileCode: string;
    dependenciesCode: string;
    inputFileImports: string[];
    dependenciesImports: string[];
    methods: { name: string; code: string }[];
    message?: string;
    isJavaScript: boolean;
    exportType: "default" | "named" | "unknown";
    classImportStatements: string[];
  } {
    console.log(' bundle methodName', this.methodName);
    const inputFileCode = fs.readFileSync(this.entryFilePath, "utf-8");
    const inputFileImports = this.extractImports(this.entryFilePath);
    const isJavaScript = path.extname(this.entryFilePath) === ".js";
    const classImportStatements = this.createClassImportStatement(this.entryFilePath, isJavaScript);
    const { dependenciesCode, dependenciesImports } = this.processFile(
      this.entryFilePath
    );
    const methods = this.extractMethods(this.entryFilePath, this.methodName);

    let message: string | undefined;
    if (dependenciesCode.trim() === "" && dependenciesImports.length === 0) {
      message = "No local dependencies found for the entry file.";
    }

    const cleanDependenciesCode = this.cleanCode(dependenciesCode);
    const cleanDependenciesImports = this.cleanImports(dependenciesImports);

    if (process.env.DEBUG === "true") {
      fs.writeFileSync("dependencies.txt", cleanDependenciesCode);
      fs.writeFileSync("methods.txt", methods.map((m) => m.code).join("\n\n"));
      fs.writeFileSync("inputFileCode.txt", inputFileCode);
      fs.writeFileSync("inputFileImports.txt", inputFileImports.join("\n"));
      fs.writeFileSync(
        "dependenciesImports.txt",
        cleanDependenciesImports.join("\n")
      );
      fs.writeFileSync("classImportStatements.txt", classImportStatements.join("\n"));
    }

    const exportType = this.determineExportType(this.entryFilePath);

    return {
      inputFileCode,
      dependenciesCode: cleanDependenciesCode,
      inputFileImports,
      dependenciesImports: cleanDependenciesImports,
      methods,
      message,
      isJavaScript,
      exportType,
      classImportStatements,
    };
  }

  private determineExportType(
    filePath: string
  ): "default" | "named" | "unknown" {
    const sourceCode = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    let hasDefaultExport = false;
    let hasNamedExport = false;

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isExportAssignment(node)) {
        hasDefaultExport = true;
      } else if (
        ts.isExportDeclaration(node) ||
        (ts.isVariableStatement(node) &&
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
      ) {
        hasNamedExport = true;
      }
    });

    if (hasDefaultExport && !hasNamedExport) return "default";
    if (hasNamedExport && !hasDefaultExport) return "named";
    return "unknown";
  }

  private extractMethods(filePath: string, reqMethodName: string): { name: string; code: string }[] {
    const sourceCode = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const methods: { name: string; code: string }[] = [];
    let anonymousCounter = 0;

    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node)) {
        // Handle class methods
        const className = node.name
          ? node.name.getText()
          : `AnonymousClass_${anonymousCounter++}`;
        node.members.forEach((member) => {
          if (ts.isMethodDeclaration(member)) {
            const methodName = member.name
              ? member.name.getText()
              : `anonymousMethod_${anonymousCounter++}`;
            const fullName = `${className}.${methodName}`;
            const code = member.getFullText();
            if(reqMethodName) {
              if (reqMethodName.toLowerCase() === methodName.toLowerCase()) {
                methods.push({ name: fullName, code });
              }
            } else {
              methods.push({ name: fullName, code });
            }
          }
        });
      } else if (ts.isFunctionDeclaration(node)) {
        // Handle function declarations
        const name = node.name
          ? node.name.getText()
          : `anonymousFunction_${anonymousCounter++}`;
        const code = node.getFullText();
        if (reqMethodName) {
          if (reqMethodName.toLocaleLowerCase() === name.toLocaleLowerCase()) {
            methods.push({ name, code });
          }
        } else {
          methods.push({ name, code });
        }
      } else if (ts.isVariableStatement(node)) {
        // Handle functions assigned to variables
        node.declarationList.declarations.forEach((declaration) => {
          if (ts.isVariableDeclaration(declaration)) {
            const varName = declaration.name.getText();
            const initializer = declaration.initializer;
            if (
              initializer &&
              (ts.isFunctionExpression(initializer) ||
                ts.isArrowFunction(initializer))
            ) {
              const code = initializer.getFullText();
              if (reqMethodName) {
                if(reqMethodName.toLocaleLowerCase() === varName.toLocaleLowerCase()) {
                  methods.push({ name: varName, code });
                }
              } else {
                methods.push({ name: varName, code });
              }
            }
          }
        });
      }
      // Continue traversal
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);

    return methods;
  }

  private processFile(filePath: string): {
    dependenciesCode: string;
    dependenciesImports: string[];
  } {
    const absolutePath = path.resolve(filePath);
    if (this.visitedFiles.has(absolutePath)) {
      return { dependenciesCode: "", dependenciesImports: [] };
    }
    this.visitedFiles.add(absolutePath);

    const sourceCode = fs.readFileSync(absolutePath, "utf-8");
    const isJavaScript = path.extname(absolutePath) === ".js";
    const sourceFile = ts.createSourceFile(
      absolutePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      isJavaScript ? ts.ScriptKind.JS : ts.ScriptKind.TS
    );

    let dependenciesCode = "";
    let dependenciesImports: string[] = [];

    const processNode = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const importPath = (node.moduleSpecifier as ts.StringLiteral).text;
        const result = this.processImport(importPath, absolutePath);
        dependenciesCode += result.dependenciesCode;
        dependenciesImports.push(...result.dependenciesImports);
      } else if (absolutePath !== this.entryFilePath) {
        // Include all type definitions and functions from dependencies
        if (
          ts.isInterfaceDeclaration(node) ||
          ts.isTypeAliasDeclaration(node) ||
          ts.isClassDeclaration(node) ||
          ts.isFunctionDeclaration(node) ||
          ts.isVariableStatement(node) ||
          ts.isExportDeclaration(node)
        ) {
          // Add source file path as comment before each declaration
          dependenciesCode += `// From ${path.relative(path.dirname(this.entryFilePath), absolutePath)}\n`;
          dependenciesCode += node.getFullText(sourceFile) + "\n\n";
        }
      }

      ts.forEachChild(node, processNode);
    };

    ts.forEachChild(sourceFile, processNode);

    return { dependenciesCode, dependenciesImports };
  }

  private processImport(
    importPath: string,
    absolutePath: string
  ): {
    dependenciesCode: string;
    dependenciesImports: string[];
  } {
    let dependenciesCode = "";
    let dependenciesImports: string[] = [];

    if (importPath.startsWith(".") || path.isAbsolute(importPath)) {
      let importedFilePath = importPath;
      if (!importPath.endsWith(".ts") && !importPath.endsWith(".js")) {
        const extensions = [".ts", ".js", "/index.ts", "/index.js"];
        for (const ext of extensions) {
          const testPath = importPath + ext;
          const resolvedTestPath = path.resolve(
            path.dirname(absolutePath),
            testPath
          );
          if (fs.existsSync(resolvedTestPath)) {
            importedFilePath = testPath;
            break;
          }
        }
      }
      
      const resolvedImportPath = path.resolve(
        path.dirname(absolutePath),
        importedFilePath
      );

      if (fs.existsSync(resolvedImportPath) && resolvedImportPath !== this.entryFilePath) {
        const result = this.processFile(resolvedImportPath);
        dependenciesCode += `// ${path.relative(
          path.dirname(this.entryFilePath),
          resolvedImportPath
        )}\n`;
        dependenciesCode += result.dependenciesCode + "\n";
        dependenciesImports.push(...result.dependenciesImports);
      }
    }
    dependenciesImports.push(importPath);

    return { dependenciesCode, dependenciesImports };
  }

  private extractImports(filePath: string): string[] {
    const sourceCode = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const imports: string[] = [];

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        imports.push(node.getFullText(sourceFile).trim());
      }
    });

    return imports;
  }

  private createClassImportStatement(filePath: string, isJavaScript: boolean): string [] {
    // get class name
    const sourceCode = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );
    let className = '';
    const classImportStatememts: string[] = [];
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node)) {
        className = node.name?.getText() || '';
        if (className) {
          if (isJavaScript) {
            // todo: handle javascript class import
            classImportStatememts.push(`Const { ${className} } = require ('./${path.basename(filePath, path.extname(filePath))}');`);
          } else {
            classImportStatememts.push(`import ${className} from './${path.basename(filePath, path.extname(filePath))}';`);
          }
        }
      }
    });
    return classImportStatememts;
  }

  private cleanCode(code: string): string {
    const lines = code.split("\n");
    const cleanedLines: string[] = [];
    let insideInterface = false;
    let insideFunction = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("export interface") || line.startsWith("interface")) {
        insideInterface = true;
        cleanedLines.push(line);
      } else if (
        line.startsWith("export function") ||
        line.startsWith("function")
      ) {
        insideFunction = true;
        cleanedLines.push(line);
      } else if (line === "}") {
        insideInterface = false;
        insideFunction = false;
        cleanedLines.push(line);
      } else if (insideInterface || insideFunction) {
        if (line && !line.startsWith("export")) {
          cleanedLines.push("  " + line);
        }
      } else if (line && !line.startsWith("export")) {
        cleanedLines.push(line);
      }
    }

    return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  private cleanImports(imports: string[]): string[] {
    // Remove duplicate imports and sort them
    const uniqueImports = Array.from(new Set(imports));
    return uniqueImports.sort();
  }
}
