import type {MyTSModule} from "./MyTSModule.d.mts"
import type {MyTSSourceFile} from "./MyTSSourceFile.d.mts"
import {getMyTSSourceFileInternals} from "#~src/getMyTSSourceFileInternals.mts"

import {
	getModuleImportAndExportSpecifiers as impl
} from "@aniojs/node-ts-utils"

export function getModuleImportAndExportSpecifiers(
	src: MyTSModule|MyTSSourceFile
): string[] {
	const inputSourceFile = "source" in src ? src.source : src
	const {tsSourceFile} = getMyTSSourceFileInternals(inputSourceFile)

	return impl(tsSourceFile)
}
