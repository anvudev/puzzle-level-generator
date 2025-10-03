import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GenerateImage from "../page";

// Mock the API service
vi.mock("../../api/services/imagesService", () => ({
  convertImage: vi.fn(),
}));

// Mock the clients
vi.mock("../../api/clients", () => ({
  kvSaveImage: vi.fn(),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("GenerateImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render upload interface", () => {
    render(<GenerateImage />);
    
    expect(screen.getByText("Generate Pixel Art")).toBeInTheDocument();
    expect(screen.getByText("Upload an image and convert it to pixel art matrix")).toBeInTheDocument();
    expect(screen.getByText("Click để chọn ảnh")).toBeInTheDocument();
    expect(screen.getByText("Hỗ trợ PNG, JPEG, WebP (tối đa 10MB)")).toBeInTheDocument();
  });

  it("should validate file type correctly", async () => {
    render(<GenerateImage />);
    
    const fileInput = screen.getByRole("button", { name: /tải ảnh lên/i });
    
    // Create a fake file with wrong type
    const wrongFile = new File(["fake content"], "test.txt", {
      type: "text/plain",
    });

    // Mock file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [wrongFile],
      writable: false,
    });

    // Trigger change event
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Chỉ hỗ trợ file PNG, JPEG, WebP/)).toBeInTheDocument();
    });
  });

  it("should validate file size correctly", async () => {
    render(<GenerateImage />);
    
    // Create a fake large file
    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.png", {
      type: "image/png",
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/File quá lớn/)).toBeInTheDocument();
    });
  });

  it("should accept valid image files", async () => {
    const { convertImage } = await import("../../api/services/imagesService");
    const mockConvertImage = convertImage as any;
    
    mockConvertImage.mockResolvedValue({
      meta: {
        cols: 30,
        rows: 30,
        palette: { "0": "#ff0000", "1": "#00ff00" },
        mode: "test",
      },
      matrix: [[0, 1], [1, 0]],
    });

    render(<GenerateImage />);
    
    const validFile = new File(["fake png content"], "test.png", {
      type: "image/png",
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [validFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockConvertImage).toHaveBeenCalled();
    });
  });
});
