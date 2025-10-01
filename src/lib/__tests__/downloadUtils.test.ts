/**
 * Tests for download utilities
 * Verifies Task 7: Markdown File Download functionality
 */

import {
  downloadFile,
  validateFilename,
  generateSafeFilename,
} from "../downloadUtils";

// Mock DOM APIs
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock document.createElement
Object.defineProperty(document, "createElement", {
  value: mockCreateElement,
  writable: true,
});

// Mock document.body
Object.defineProperty(document, "body", {
  value: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
  },
  writable: true,
});

describe("downloadUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock element with download attribute support
    const mockElement = {
      href: "",
      download: "",
      style: { display: "" },
      click: mockClick,
    };

    // Mock the download attribute support check
    mockCreateElement.mockImplementation(tagName => {
      if (tagName === "a") {
        return {
          ...mockElement,
          download: "", // Simulate download attribute support
        };
      }
      return mockElement;
    });

    mockCreateObjectURL.mockReturnValue("mock-url");
  });

  describe("downloadFile", () => {
    it("should download a file successfully", async () => {
      const options = {
        filename: "test.md",
        content: "# Test Content",
        mimeType: "text/markdown",
        charset: "utf-8",
      };

      const result = await downloadFile(options);

      expect(result.success).toBe(true);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it("should handle invalid filename", async () => {
      const options = {
        filename: "",
        content: "# Test Content",
      };

      const result = await downloadFile(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid filename");
    });

    it("should handle invalid content", async () => {
      const options = {
        filename: "test.md",
        content: null as any,
      };

      const result = await downloadFile(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Content must be a string");
    });

    it("should add .md extension if missing", async () => {
      const options = {
        filename: "test",
        content: "# Test Content",
      };

      await downloadFile(options);

      const mockElement = mockCreateElement.mock.results[0].value;
      expect(mockElement.download).toBe("test.md");
    });

    it("should preserve .md extension if present", async () => {
      const options = {
        filename: "test.md",
        content: "# Test Content",
      };

      await downloadFile(options);

      const mockElement = mockCreateElement.mock.results[0].value;
      expect(mockElement.download).toBe("test.md");
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

      const options = {
        filename: "test.md",
        content: "# Test Content",
      };

      const result = await downloadFile(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Browser does not support file downloads");
    });
  });

  describe("validateFilename", () => {
    it("should validate correct filename", () => {
      const result = validateFilename("test-file.md");
      expect(result).toBe("test-file.md");
    });

    it("should sanitize invalid characters", () => {
      const result = validateFilename('test<>:"/\\|?*.md');
      expect(result).toBe("test__________.md");
    });

    it("should replace spaces with underscores", () => {
      const result = validateFilename("test file name.md");
      expect(result).toBe("test_file_name.md");
    });

    it("should throw error for empty filename", () => {
      expect(() => validateFilename("")).toThrow(
        "Filename must be a non-empty string"
      );
    });

    it("should throw error for too long filename", () => {
      const longName = "a".repeat(256);
      expect(() => validateFilename(longName)).toThrow("Filename too long");
    });
  });

  describe("generateSafeFilename", () => {
    it("should return original filename if no conflicts", () => {
      const result = generateSafeFilename("test.md", ["other.md"]);
      expect(result).toBe("test.md");
    });

    it("should add timestamp for conflicts", () => {
      const result = generateSafeFilename("test.md", ["test.md"]);
      expect(result).toMatch(/^test_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.md$/);
    });

    it("should handle filename without extension", () => {
      const result = generateSafeFilename("test", ["test.md"]);
      expect(result).toMatch(/^test_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.md$/);
    });
  });
});
