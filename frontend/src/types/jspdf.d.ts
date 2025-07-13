declare module 'jspdf' {
  export interface jsPDFOptions {
    orientation?: 'portrait' | 'landscape' | 'p' | 'l';
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc';
    format?: string | [number, number];
    compress?: boolean;
    precision?: number;
    filters?: string[];
    userUnit?: number;
  }

  export default class jsPDF {
    constructor(options?: jsPDFOptions);
    constructor(
      orientation?: 'portrait' | 'landscape' | 'p' | 'l',
      unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc',
      format?: string | [number, number],
      compress?: boolean
    );

    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
      rotation?: number
    ): jsPDF;

    addPage(format?: string | [number, number], orientation?: 'portrait' | 'landscape' | 'p' | 'l'): jsPDF;
    
    save(filename: string): void;
    
    setFontSize(fontSize: number): jsPDF;
    setFont(fontName: string, fontStyle?: string): jsPDF;
    text(text: string | string[], x: number, y: number, options?: any): jsPDF;
    
    internal: {
      pageSize: {
        width: number;
        height: number;
      };
    };
  }
}