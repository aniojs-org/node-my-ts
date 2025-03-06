import ts from "typescript"

import type {VirtualProgramFile} from "./VirtualProgramFile.d.mts"
import type {MyTSProgram, Internal as MyTSProgramInternal} from "#~src/internal/types/MyTSProgram.d.mts"
import {createMyTSModule} from "#~src/internal/createMyTSModule.mts"
import {realpathSync} from "node:fs"

export function createProgram(
	userProjectRoot: string,
	input: (string|VirtualProgramFile)[],
	tsCompilerOptions: ts.CompilerOptions
): MyTSProgram {
	const projectRoot = realpathSync(userProjectRoot)

	//
	// all input paths are relative to the project root
	// in order for typescript to correctly pick them up
	// we temporarily change into the project root's directory
	//
	// testing shows that the working directory isn't relevant after
	// creating the program with ts.createProgram
	//
	const savedCWD = process.cwd()

	try {
		process.chdir(projectRoot)

		const inputFilePaths: string[] = []
		const virtualFiles: Map<string, string> = new Map()

		// todo: maybe check that every file on disk is inside the project root path?
		for (const entry of input) {
			if (typeof entry === "string") {
				inputFilePaths.push(entry)

				continue
			}

			const virtualFile = entry as VirtualProgramFile

			virtualFiles.set(virtualFile.path, virtualFile.content)
			inputFilePaths.push(virtualFile.path)
		}

		const tsCompilerHost = ts.createCompilerHost(tsCompilerOptions, true)

		tsCompilerHost.jsDocParsingMode = ts.JSDocParsingMode.ParseAll

		tsCompilerHost.fileExists = (filePath) => {
			return virtualFiles.has(filePath) || ts.sys.fileExists(filePath)
		}

		tsCompilerHost.readFile = (filePath) => {
			if (virtualFiles.has(filePath)) {
				return virtualFiles.get(filePath)
			}

			return ts.sys.readFile(filePath)
		}

		const tsProgram = ts.createProgram(
			inputFilePaths, tsCompilerOptions, tsCompilerHost
		)

		const tsChecker = tsProgram.getTypeChecker()

		const internal: MyTSProgramInternal = {
			cachedModules: new Map(),
			__self: {} as MyTSProgram
		}

		const myProgram: MyTSProgram = {
			projectRoot,
			tsProgram,
			tsChecker,
			tsCompilerHost,
			tsCompilerOptions,
			getSourceFile(filePath) {
				const sourceFile = tsProgram.getSourceFile(filePath)

				if (!sourceFile) {
					throw new Error(`No such source file '${filePath}'.`)
				}

				return sourceFile
			},
			getModule(filePath) {
				// todo: normalize path
				if (internal.cachedModules.has(filePath)) {
					return internal.cachedModules.get(filePath)!
				}

				const mod = createMyTSModule(internal.__self, filePath)

				internal.cachedModules.set(filePath, mod)

				return mod
			},
			__internal: internal
		}

		internal.__self = myProgram

		return myProgram
	} finally {
		process.chdir(savedCWD)
	}
}
