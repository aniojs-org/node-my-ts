import type {MyTSModule} from "./MyTSModule.d.mts"
import type {MyTSDiagnosticMessage} from "./MyTSDiagnosticMessage.d.mts"
import {getMyTSProgramInternals} from "#~src/getMyTSProgramInternals.mts"
import {getMyTSSourceFileInternals} from "#~src/getMyTSSourceFileInternals.mts"
import {convertTSDiagnostic} from "#~src/utils/convertTSDiagnostic.mts"

export function typeCheckModule(
	mod: MyTSModule,
	includeAllDiagnostics?: boolean
): MyTSDiagnosticMessage[] {
	const {tsProgram} = getMyTSProgramInternals(mod.program)
	const {tsSourceFile} = getMyTSSourceFileInternals(mod.source)

	return (
		includeAllDiagnostics === true ? [
			...getGlobalDiagnostics(),
			...getSourceFileDiagnostics()
		] : [
			...getSourceFileDiagnostics()
		]
	).map(diagnostic => {
		return convertTSDiagnostic(diagnostic, true)
	})

	function getGlobalDiagnostics() {
		return [
			...tsProgram.getConfigFileParsingDiagnostics(),
			...tsProgram.getOptionsDiagnostics(),
			...tsProgram.getGlobalDiagnostics()
		]
	}

	function getSourceFileDiagnostics() {
		return [
			...tsProgram.getSyntacticDiagnostics(tsSourceFile),
			...tsProgram.getSemanticDiagnostics(tsSourceFile),
			...tsProgram.getDeclarationDiagnostics(tsSourceFile)
		]
	}
}
