<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProfilePhotoStorage
{
    /** @var array<int, string> */
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    /** @var array<int, string> */
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    public function store(UploadedFile $file, string $orgId, string $userId): string
    {
        $this->assertValidUpload($file);

        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = Str::uuid().'.'.$ext;
        $path = "profile-photos/{$orgId}/{$userId}/{$filename}";

        Storage::disk('public')->putFileAs(
            dirname($path),
            $file,
            basename($path),
        );

        return $path;
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
        if ($file->getSize() > 5 * 1024 * 1024) {
            abort(422, 'Profile photo must be 5 MB or smaller.');
        }

        $mime = $file->getMimeType() ?? '';
        $ext = strtolower($file->getClientOriginalExtension() ?? '');

        if (! in_array($mime, self::ALLOWED_MIMES, true) && ! in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
            abort(422, 'Profile photo must be JPG, PNG, or WEBP.');
        }
    }
}
