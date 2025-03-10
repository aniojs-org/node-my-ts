import type {MyTSFunctionDeclaration} from "./MyTSFunctionDeclaration.d.mts"

type Kind = "value" | "function" | "type"

type Export = {
	kind: Kind
}

type ValueExport = Export & {
	kind: "value"
	identifier: string
}

type FunctionExport = Export & {
	kind: "function"
	identifier: string
	declarations: MyTSFunctionDeclaration[]
}

type TypeExport = Export & {
	kind: "type"
	identifier: string
}

export type MyTSExport = ValueExport | FunctionExport | TypeExport
