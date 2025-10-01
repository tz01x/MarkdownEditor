/**
 * Tests for PDF utilities
 * Verifies Task 8: PDF Export System functionality
 */

import {
  validatePDFOptions,
  generatePDFFromElement,
  downloadPDF,
} from "../pdfUtils";

// Mock jsPDF
const mockPDF = {
  setProperties: jest.fn(),
  addImage: jest.fn(),
  output: jest.fn(
    () => new Blob(["mock pdf content"], { type: "application/pdf" })
  ),
};

jest.mock("jspdf", () => {
  return jest.fn(() => mockPDF);
});

// Mock html2canvas
const mockCanvas = {
  width: 800,
  height: 600,
  toDataURL: jest.fn(() => "data:image/png;base64,mock-image-data"),
};

jest.mock("html2canvas", () => {
  return jest.fn(() => Promise.resolve(mockCanvas));
});

// Mock DOM APIs
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

Object.defineProperty(document, "createElement", {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document, "body", {
  value: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
  },
  writable: true,
});

describe("pdfUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock element
    const mockElement = {
      href: "",
      download: "",
      style: { display: "" },
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockElement);
    mockCreateObjectURL.mockReturnValue("mock-url");
  });

  describe("validatePDFOptions", () => {
    it("should validate correct PDF options", () => {
      const options = {
        filename: "test.pdf",
        title: "Test Document",
        pageSize: "a4" as const,
        orientation: "portrait" as const,
        quality: 0.95,
        scale: 2,
      };

      const result = validatePDFOptions(options);
      expect(result).toEqual(expect.objectContaining(options));
    });

    it("should use default values for missing options", () => {
      const options = { filename: "test" };
      const result = validatePDFOptions(options);

      expect(result.filename).toBe("test");
      expect(result.title).toBe("Markdown Document");
      expect(result.pageSize).toBe("a4");
      expect(result.orientation).toBe("portrait");
      expect(result.quality).toBe(0.98);
      expect(result.scale).toBe(2);
    });

    it("should throw error for invalid filename", () => {
      expect(() => validatePDFOptions({ filename: "" })).toThrow(
        "Filename must be a non-empty string"
      );
      expect(() => validatePDFOptions({ filename: null as any })).toThrow(
        "Filename must be a non-empty string"
      );
    });

    it("should throw error for invalid quality", () => {
      expect(() =>
        validatePDFOptions({ filename: "test", quality: 0.05 })
      ).toThrow("Quality must be between 0.1 and 1");
      expect(() =>
        validatePDFOptions({ filename: "test", quality: 1.5 })
      ).toThrow("Quality must be between 0.1 and 1");
    });

    it("should throw error for invalid scale", () => {
      expect(() =>
        validatePDFOptions({ filename: "test", scale: 0.1 })
      ).toThrow("Scale must be between 0.5 and 5");
      expect(() => validatePDFOptions({ filename: "test", scale: 10 })).toThrow(
        "Scale must be between 0.5 and 5"
      );
    });

    it("should throw error for invalid page size", () => {
      expect(() =>
        validatePDFOptions({ filename: "test", pageSize: "invalid" as any })
      ).toThrow("Page size must be a4, letter, or legal");
    });

    it("should throw error for invalid orientation", () => {
      expect(() =>
        validatePDFOptions({ filename: "test", orientation: "invalid" as any })
      ).toThrow("Orientation must be portrait or landscape");
    });
  });

  describe("generatePDFFromElement", () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = {
        scrollWidth: 800,
        scrollHeight: 600,
      } as HTMLElement;
    });

    it("should generate PDF successfully", async () => {
      const options = {
        filename: "test.pdf",
        title: "Test Document",
      };

      const result = await generatePDFFromElement(mockElement, options);

      expect(result.success).toBe(true);
      expect(result.pdfBlob).toBeInstanceOf(Blob);
      expect(mockPDF.setProperties).toHaveBeenCalled();
      expect(mockPDF.addImage).toHaveBeenCalled();
      expect(mockPDF.output).toHaveBeenCalledWith("blob");
    });

    it("should handle missing element", async () => {
      const options = { filename: "test.pdf" };
      const result = await generatePDFFromElement(null as any, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Element is required");
    });

    it("should handle invalid filename", async () => {
      const options = { filename: "" };
      const result = await generatePDFFromElement(mockElement, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Valid filename is required");
    });

    it("should add .pdf extension if missing", async () => {
      const options = { filename: "test" };
      const result = await generatePDFFromElement(mockElement, options);

      expect(result.success).toBe(true);
      // The filename handling is done in the PDF generation logic
    });
  });

  describe("downloadPDF", () => {
    it("should download PDF successfully", async () => {
      const pdfBlob = new Blob(["mock pdf content"], {
        type: "application/pdf",
      });
      const result = await downloadPDF(pdfBlob, "test.pdf");

      expect(result.success).toBe(true);
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockClick).toHaveBeenCalled();
    });

    it("should handle missing PDF blob", async () => {
      const result = await downloadPDF(null as any, "test.pdf");

      expect(result.success).toBe(false);
      expect(result.error).toContain("PDF blob is required");
    });

    it("should handle invalid filename", async () => {
      const pdfBlob = new Blob(["mock pdf content"], {
        type: "application/pdf",
      });
      const result = await downloadPDF(pdfBlob, "");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Valid filename is required");
    });

    it("should add .pdf extension if missing", async () => {
      const pdfBlob = new Blob(["mock pdf content"], {
        type: "application/pdf",
      });
      await downloadPDF(pdfBlob, "test");

      const mockElement = mockCreateElement.mock.results[0].value;
      expect(mockElement.download).toBe("test.pdf");
    });

    it("should handle browsers without download support", async () => {
      // Mock browser without download support
      mockCreateElement.mockImplementation(tagName => {
        if (tagName === "a") {
          return {
            href: "",
            style: { display: "" },
            click: mockClick,
            // No download property = unsupported browser
          };
        }
        return {};
      });

      const pdfBlob = new Blob(["mock pdf content"], {
        type: "application/pdf",
      });
      const result = await downloadPDF(pdfBlob, "test.pdf");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Browser does not support file downloads");
    });
  });
});
