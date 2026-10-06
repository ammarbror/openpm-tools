import { JSDOM } from 'jsdom';

let mermaidInitialized = false;

function installDomGlobals(): void {
  if (typeof document !== 'undefined' && typeof window !== 'undefined') return;

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const globals: Record<string, unknown> = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    Element: dom.window.Element,
    SVGElement: dom.window.SVGElement,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    DOMParser: dom.window.DOMParser,
  };

  class ServerCSSStyleSheet {
    cssRules: { cssText: string }[] = [];

    replaceSync(): void {}

    insertRule(rule: string): number {
      this.cssRules.push({ cssText: rule });
      return this.cssRules.length - 1;
    }
  }

  globals.CSSStyleSheet = ServerCSSStyleSheet;

  for (const [name, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }

  Object.defineProperty(dom.window.document, 'adoptedStyleSheets', {
    configurable: true,
    value: [],
    writable: true,
  });

  // ponytail: fixed label measurements may overlap; use a browser renderer if layout fidelity matters.
  dom.window.SVGElement.prototype.getBBox = function getBBox() {
    return { x: 0, y: 0, width: 100, height: 20 };
  };
}

/** Render a Mermaid definition to an SVG string without requiring a browser. */
export async function renderMermaidSvg(source: string, diagramId: string): Promise<string> {
  installDomGlobals();
  const { default: mermaid } = await import('mermaid');

  if (!mermaidInitialized) {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    mermaidInitialized = true;
  }

  const { svg } = await mermaid.render(diagramId, source.trim());
  return svg;
}
