<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Driver;
use App\Models\DriverDocument;
use App\Services\DocumentStorage;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

trait StoresDriverCredentials
{
    /**
     * @return array<string, array<int, mixed>>
     */
    protected function driverCredentialRules(bool $requireLicense = false, bool $requireInsurance = false): array
    {
        $req = $requireLicense ? 'required' : 'nullable';

        return [
            'license_number' => [$req, 'string', 'max:50'],
            'license_class' => [$req, 'string', 'max:20'],
            'license_state' => [$req, 'string', 'max:2'],
            'license_expiry' => [$req, 'date'],
            'insurance_provider' => [$requireInsurance ? 'required' : 'nullable', 'string', 'max:150'],
            'insurance_policy_number' => [$requireInsurance ? 'required' : 'nullable', 'string', 'max:80'],
            'insurance_expiry' => [$requireInsurance ? 'required' : 'nullable', 'date'],
            'license_document' => [$requireLicense ? 'required' : 'nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'insurance_document' => [$requireInsurance ? 'required' : 'nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function extractDriverCredentialFields(array $data): array
    {
        return array_intersect_key($data, array_flip([
            'license_number', 'license_class', 'license_state', 'license_expiry',
            'insurance_provider', 'insurance_policy_number', 'insurance_expiry',
        ]));
    }

    protected function storeDriverCredentialDocuments(
        Request $request,
        Driver $driver,
        ?string $uploadedBy = null,
        bool $requireLicense = false,
        bool $requireInsurance = false,
    ): void {
        $storage = app(DocumentStorage::class);
        $orgId = $driver->organization_id;

        $this->persistDocumentUpload(
            $request->file('license_document'),
            $driver,
            'license',
            $storage,
            $orgId,
            $uploadedBy,
            $requireLicense,
        );

        $this->persistDocumentUpload(
            $request->file('insurance_document'),
            $driver,
            'insurance',
            $storage,
            $orgId,
            $uploadedBy,
            $requireInsurance,
        );
    }

    private function persistDocumentUpload(
        ?UploadedFile $file,
        Driver $driver,
        string $type,
        DocumentStorage $storage,
        string $orgId,
        ?string $uploadedBy,
        bool $required,
    ): void {
        if (! $file) {
            if ($required) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    $type === 'license' ? 'license_document' : 'insurance_document' => [
                        ucfirst(str_replace('_', ' ', $type)).' document upload is required.',
                    ],
                ]);
            }

            return;
        }

        $existing = DriverDocument::where('driver_id', $driver->id)
            ->where('document_type', $type)
            ->latest()
            ->first();

        if ($existing) {
            $storage->deleteIfExists($existing->file_path);
            $existing->delete();
        }

        $stored = $storage->storeDriverDocument($file, $orgId, $driver->id, $type);

        DriverDocument::create([
            'driver_id' => $driver->id,
            'document_type' => $type,
            'file_path' => $stored['file_path'],
            'original_filename' => $stored['original_filename'],
            'expiry_date' => $type === 'license'
                ? $driver->license_expiry
                : ($type === 'insurance' ? $driver->insurance_expiry : null),
            'status' => 'pending_review',
            'uploaded_by' => $uploadedBy,
        ]);
    }
}
