"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Camera, Loader2 } from "lucide-react";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  editable?: boolean;
  onUpload?: (url: string) => void;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-24 w-24 text-xl",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-4 w-4",
  xl: "h-5 w-5",
  "2xl": "h-6 w-6",
};

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  editable = false,
  onUpload,
  className,
  ...props
}: AvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onUpload?.(data.data.avatarUrl);
      } else {
        alert(data.error || "Failed to upload image");
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const displaySrc = previewUrl || src;

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full ring-4 ring-white shadow-sm",
        sizeClasses[size],
        editable && "cursor-pointer group",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={alt || "Avatar"}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary/10 font-semibold text-primary">
          {fallback || "?"}
        </div>
      )}
      
      {/* Edit overlay */}
      {editable && (
        <>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            {isUploading ? (
              <Loader2 className={cn("text-white animate-spin", iconSizes[size])} />
            ) : (
              <Camera className={cn("text-white opacity-0 group-hover:opacity-100 transition-opacity", iconSizes[size])} />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
