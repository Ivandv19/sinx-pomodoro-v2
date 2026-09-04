/** @jsxImportSource react */
// Iconos
import { Icon } from "@iconify/react";
// i18n
import { languages } from "../../i18n/ui";
// Componentes
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// Props del componente (interfaz local)
interface LanguagePickerProps {
	lang: "es" | "en";
}

// Genera la URL del idioma destino conservando la ruta actual
const getLangPath = (target: string, current: string) => {
	const clean = current.replace(/^\/(es|en)(\/|$)/, "/").replace(/^\/+/, "");
	if (target === "es") return clean ? `/${clean}` : "/";
	return clean ? `/en/${clean}` : "/en";
};

// Selector de idioma (desplegable)
export default function LanguagePicker({ lang }: LanguagePickerProps) {
	const currentPath =
		typeof window !== "undefined" ? window.location.pathname : "/";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="sm"
						className="gap-2 px-3 group"
						aria-label="Change language"
					>
						<Icon
							icon="lucide:languages"
							className="w-4 h-4 group-hover:text-primary transition-colors"
						/>
						<span className="text-xs font-bold uppercase">{lang}</span>
						<Icon
							icon="lucide:chevron-down"
							className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity"
						/>
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-36 p-1">
				{Object.entries(languages).map(([labelLang, label]) => (
					<DropdownMenuItem
						key={labelLang}
						className={`flex items-center gap-3 px-3 py-2 ${
							lang === labelLang
								? "bg-primary/10 text-primary"
								: "text-foreground/70"
						}`}
						onClick={() => {
							try {
								localStorage.setItem("language", labelLang);
							} catch {
								/* storage bloqueado: ignorar */
							}
							window.location.href = getLangPath(labelLang, currentPath);
						}}
					>
						<span
							className={`w-1.5 h-1.5 rounded-full bg-primary transition-opacity ${
								lang === labelLang ? "opacity-100" : "opacity-0"
							}`}
						></span>
						{label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
