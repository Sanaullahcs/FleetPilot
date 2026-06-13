<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentStorage
{
    /** @var array<int, string> */
    private const ALLOWED_MIMES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    /** @var array<int, string> */
    private const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

    public function storeDriverDocument(UploadedFile $file, string $orgId, string $driverId, string $documentType): array
    {
        $this->assertValidUpload($file);

        $ext = strtolower($file->getClientOriginalExtension() ?: 'pdf');
        $filename = Str::uuid().'.'.$ext;
        $path = "driver-documents/{$orgId}/{$driverId}/{$documentType}/{$filename}";

        Storage::disk('public')->putFileAs(
            dirname($path),
            $file,
            basename($path),
        );

        return [
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
        ];
    }

    public function deleteIfExists(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    public function publicUrl(string $path): string
    {
        return Storage::disk('public')->url($path);
    }

    private function assertValidUpload(UploadedFile $file): void
    {
        if ($file->getSize() > 10 * 1024 * 1024) {
            abort(422, 'Each document must be 10 MB or smaller.');
        }

        $mime = $file->getMimeType() ?? '';
        $ext = strtolower($file->getClientOriginalExtension() ?? '');

        if (! in_array($mime, self::ALLOWED_MIMES, true) && ! in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
            abort(422, 'Documents must be PDF, JPG, PNG, or WEBP.');
        }
    }
}
