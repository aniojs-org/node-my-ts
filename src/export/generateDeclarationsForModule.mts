import ts from "typescript"
import type {MyTSModule} from "./MyTSModule.d.mts"
import {getMyTSSourceFileInternals} from "#~src/getMyTSSourceFileInternals.mts"
import {getMyTSProgramInternals} from "#~src/getMyTSProgramInternals.mts"
import type {MyTSDiagnosticMessage} from "./MyTSDiagnosticMessage.d.mts"
import type {MyTSSourceFileTransformer} from "./MyTSSourceFileTransformer.d.mts"
import {_transformTSSourceFile} from "#~src/utils/_transformTSSourceFile.mts"
import {convertTSDiagnostic} from "#~src/utils/convertTSDiagnostic.mts"

export function generateDeclarationsForModule(
	module: MyTSModule,
	transform?: MyTSSourceFileTransformer|MyTSSourceFileTransformer[]
): {
	emitSkipped: boolean
	diagnosticMessages: MyTSDiagnosticMessage[]
	declarations: string
} {
	const transformer: MyTSSourceFileTransformer[] = (() => {
		if (transform && Array.isArray(transform)) {
			return transform
		} else if (transform) {
			return [transform]
		}

		return []
	})()

	const {tsSourceFile} = getMyTSSourceFileInternals(module.source)
	const {tsProgram} = getMyTSProgramInternals(module.program)

	let declarations = ""

	const emitResult = tsProgram.emit(
		tsSourceFile,
		writeCallback,
		undefined,
		true,
		{
			afterDeclarations: [
				() => {
					return function transform(src) {
						if (ts.isBundle(src)) {
							throw new Error(
								`Unexpected ts.Bundle: bundles are not supported.`
							)
						}

						if (!transform.length) {
							return src
						}

						return _transformTSSourceFile(src, transformer)
					}
				}
			]
		}
	)

	return {
		emitSkipped: emitResult.emitSkipped,
		declarations,
		diagnosticMessages: emitResult.diagnostics.map(convertTSDiagnostic)
	}

	function writeCallback(fileName: string, text: string) {
		const tsDeclarationFileName = tsSourceFile.fileName.slice(0, -4) + ".d.mts"

		if (fileName === tsDeclarationFileName) {
			declarations = text
		}
	}
}
