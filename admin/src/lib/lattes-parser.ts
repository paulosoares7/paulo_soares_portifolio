// Leitura do XML do currículo Lattes (arquivo exportado na Plataforma Lattes).
// O Lattes não tem API aberta; o professor baixa o XML (ou o .zip) e envia.
import { XMLParser } from "fast-xml-parser";
import { unzipSync } from "fflate";
import type { ImportItem } from "@/validators/publication";
import { normalizeDoi } from "@/validators/publication";

type Attrs = Record<string, string | undefined>;
type XmlNode = Attrs & { [child: string]: unknown };

/** Resultado da leitura do currículo. */
export type LattesResult = {
  items: ImportItem[];
  updatedAt: string | null;
  ownerName: string | null;
};

// Elementos que podem se repetir: sempre lidos como lista.
const REPEATED = new Set([
  "ARTIGO-PUBLICADO",
  "TRABALHO-EM-EVENTOS",
  "LIVRO-PUBLICADO-OU-ORGANIZADO",
  "CAPITULO-DE-LIVRO-PUBLICADO",
  "AUTORES",
]);

/**
 * Converte o arquivo enviado (XML ou ZIP com o XML) em texto.
 * O Lattes exporta em ISO-8859-1; a declaração do XML diz a codificação.
 * @param bytes Conteúdo do arquivo.
 * @returns Texto do XML.
 */
export function decodeLattesFile(bytes: Uint8Array): string {
  let xmlBytes = bytes;
  // "PK" no início = arquivo ZIP.
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    const files = unzipSync(bytes);
    const name = Object.keys(files).find((file) => file.toLowerCase().endsWith(".xml"));
    if (!name || !files[name]) throw new Error("O ZIP não contém um arquivo .xml.");
    xmlBytes = files[name];
  }
  const head = new TextDecoder("ascii").decode(xmlBytes.slice(0, 200));
  const encoding = head.match(/encoding=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "utf-8";
  return new TextDecoder(
    encoding.includes("8859") || encoding.includes("latin") ? "latin1" : "utf-8",
  ).decode(xmlBytes);
}

function asList(value: unknown): XmlNode[] {
  if (Array.isArray(value)) return value as XmlNode[];
  return value ? [value as XmlNode] : [];
}

function child(node: XmlNode | undefined, name: string): XmlNode | undefined {
  const value = node?.[name];
  return (Array.isArray(value) ? value[0] : value) as XmlNode | undefined;
}

function text(value: string | undefined, max: number): string | null {
  const clean = value?.replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : null;
}

function pages(start: string | undefined, end: string | undefined): string | null {
  const first = start?.trim();
  const last = end?.trim();
  if (first && last) return `${first}-${last}`.slice(0, 30);
  return text(first, 30);
}

/** Autores no formato de citação, na ordem de autoria: "SOBRENOME, N.; ..." */
function authors(node: XmlNode): string {
  return asList(node.AUTORES)
    .sort((a, b) => Number(a["ORDEM-DE-AUTORIA"] ?? 0) - Number(b["ORDEM-DE-AUTORIA"] ?? 0))
    .map((author) =>
      (author["NOME-PARA-CITACAO"] ?? author["NOME-COMPLETO-DO-AUTOR"] ?? "").split(";")[0]?.trim(),
    )
    .filter(Boolean)
    .join("; ")
    .slice(0, 1000);
}

function keywords(node: XmlNode): string | null {
  const block = child(node, "PALAVRAS-CHAVE");
  if (!block) return null;
  const words = [1, 2, 3, 4, 5, 6].map((n) => block[`PALAVRA-CHAVE-${n}`]?.trim()).filter(Boolean);
  return words.length ? words.join("; ").slice(0, 500) : null;
}

function url(value: string | undefined): string | null {
  // O Lattes às vezes grava a URL entre colchetes: [http://...]
  const clean = value?.replace(/^\[|\]$/g, "").trim();
  return clean && /^https?:\/\//i.test(clean) ? clean.slice(0, 500) : null;
}

function year(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1900 ? parsed : null;
}

/**
 * Lê as publicações do XML do Lattes.
 * Cobre artigos, trabalhos em eventos, livros e capítulos.
 * @param xml Texto do XML (use decodeLattesFile antes).
 * @returns Publicações normalizadas, data de atualização e nome do dono.
 */
export function parseLattesXml(xml: string): LattesResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    isArray: (name) => REPEATED.has(name),
  });
  const root = (parser.parse(xml) as Record<string, XmlNode | undefined>)["CURRICULO-VITAE"];
  if (!root)
    throw new Error("Este arquivo não parece ser um currículo Lattes (falta CURRICULO-VITAE).");

  const production = child(root, "PRODUCAO-BIBLIOGRAFICA");
  const items: ImportItem[] = [];

  for (const article of asList(child(production, "ARTIGOS-PUBLICADOS")?.["ARTIGO-PUBLICADO"])) {
    const basic = child(article, "DADOS-BASICOS-DO-ARTIGO");
    const detail = child(article, "DETALHAMENTO-DO-ARTIGO");
    const published = year(basic?.["ANO-DO-ARTIGO"]);
    const title = text(basic?.["TITULO-DO-ARTIGO"], 500);
    if (!title || !published) continue;
    items.push({
      externalId: `artigo-${article["SEQUENCIA-PRODUCAO"] ?? title}`.slice(0, 100),
      type: "journal_article",
      title,
      authors: authors(article) || "—",
      venue: text(detail?.["TITULO-DO-PERIODICO-OU-REVISTA"], 300),
      year: published,
      volume: text(detail?.VOLUME, 20),
      issue: text(detail?.FASCICULO, 20),
      pages: pages(detail?.["PAGINA-INICIAL"], detail?.["PAGINA-FINAL"]),
      doi: normalizeDoi(basic?.DOI),
      url: url(basic?.["HOME-PAGE-DO-TRABALHO"]),
      keywords: keywords(article),
    });
  }

  for (const paper of asList(child(production, "TRABALHOS-EM-EVENTOS")?.["TRABALHO-EM-EVENTOS"])) {
    const basic = child(paper, "DADOS-BASICOS-DO-TRABALHO");
    const detail = child(paper, "DETALHAMENTO-DO-TRABALHO");
    const published = year(basic?.["ANO-DO-TRABALHO"]);
    const title = text(basic?.["TITULO-DO-TRABALHO"], 500);
    if (!title || !published) continue;
    items.push({
      externalId: `evento-${paper["SEQUENCIA-PRODUCAO"] ?? title}`.slice(0, 100),
      // NATUREZA = COMPLETO, RESUMO ou RESUMO_EXPANDIDO.
      type: basic?.NATUREZA === "RESUMO" ? "abstract" : "conference_paper",
      title,
      authors: authors(paper) || "—",
      venue: text(detail?.["NOME-DO-EVENTO"], 300),
      year: published,
      volume: text(detail?.VOLUME, 20),
      issue: text(detail?.FASCICULO, 20),
      pages: pages(detail?.["PAGINA-INICIAL"], detail?.["PAGINA-FINAL"]),
      doi: normalizeDoi(basic?.DOI),
      url: url(basic?.["HOME-PAGE-DO-TRABALHO"]),
      keywords: keywords(paper),
    });
  }

  const books = child(production, "LIVROS-E-CAPITULOS");
  for (const book of asList(
    child(books, "LIVROS-PUBLICADOS-OU-ORGANIZADOS")?.["LIVRO-PUBLICADO-OU-ORGANIZADO"],
  )) {
    const basic = child(book, "DADOS-BASICOS-DO-LIVRO");
    const detail = child(book, "DETALHAMENTO-DO-LIVRO");
    const published = year(basic?.ANO);
    const title = text(basic?.["TITULO-DO-LIVRO"], 500);
    if (!title || !published) continue;
    items.push({
      externalId: `livro-${book["SEQUENCIA-PRODUCAO"] ?? title}`.slice(0, 100),
      type: "book",
      title,
      authors: authors(book) || "—",
      venue: text(detail?.["NOME-DA-EDITORA"], 300),
      year: published,
      volume: text(detail?.VOLUME, 20),
      issue: null,
      pages: text(detail?.["NUMERO-DE-PAGINAS"], 30),
      doi: normalizeDoi(basic?.DOI),
      url: url(basic?.["HOME-PAGE-DO-TRABALHO"]),
      keywords: keywords(book),
    });
  }

  for (const chapter of asList(
    child(books, "CAPITULOS-DE-LIVROS-PUBLICADOS")?.["CAPITULO-DE-LIVRO-PUBLICADO"],
  )) {
    const basic = child(chapter, "DADOS-BASICOS-DO-CAPITULO");
    const detail = child(chapter, "DETALHAMENTO-DO-CAPITULO");
    const published = year(basic?.ANO);
    const title = text(basic?.["TITULO-DO-CAPITULO-DO-LIVRO"], 500);
    if (!title || !published) continue;
    const bookTitle = detail?.["TITULO-DO-LIVRO"]?.trim();
    const publisher = detail?.["NOME-DA-EDITORA"]?.trim();
    items.push({
      externalId: `capitulo-${chapter["SEQUENCIA-PRODUCAO"] ?? title}`.slice(0, 100),
      type: "book_chapter",
      title,
      authors: authors(chapter) || "—",
      venue: text([bookTitle, publisher].filter(Boolean).join(". "), 300),
      year: published,
      volume: null,
      issue: null,
      pages: pages(detail?.["PAGINA-INICIAL"], detail?.["PAGINA-FINAL"]),
      doi: normalizeDoi(basic?.DOI),
      url: url(basic?.["HOME-PAGE-DO-TRABALHO"]),
      keywords: keywords(chapter),
    });
  }

  // DATA-ATUALIZACAO vem como ddmmaaaa.
  const rawDate = root["DATA-ATUALIZACAO"];
  const updatedAt =
    rawDate && /^\d{8}$/.test(rawDate)
      ? `${rawDate.slice(4)}-${rawDate.slice(2, 4)}-${rawDate.slice(0, 2)}`
      : null;
  const ownerName = child(root, "DADOS-GERAIS")?.["NOME-COMPLETO"] ?? null;

  return { items, updatedAt, ownerName };
}
