<?php

namespace App\Http\Controllers\Concerns;

use App\Models\GpsSnapshot;
use App\Models\Vehicle;
use Illuminate\Support\Carbon;

trait ResolvesVehiclePosition
{
    /**
     * @return array{latitude: float, longitude: float, heading: float, speed_mph: float, recorded_at: string, is_simulated: bool}
     */
    protected function resolveVehiclePosition(Vehicle $vehicle, int $index, Carbon $now): array
    {
        $snapshot = GpsSnapshot::where('vehicle_id', $vehicle->id)->latest('recorded_at')->first();

        if ($snapshot) {
            return [
                'latitude' => (float) $snapshot->latitude,
                'longitude' => (float) $snapshot->longitude,
                'heading' => (float) ($snapshot->heading ?? 0),
                'speed_mph' => (float) ($snapshot->speed_mph ?? 0),
                'recorded_at' => $snapshot->recorded_at?->toIso8601String() ?? $now->toIso8601String(),
                'is_simulated' => false,
            ];
        }

        $simulated = $this->simulatedVehiclePosition($vehicle->id, $index, $now);

        return array_merge($simulated, ['is_simulated' => true]);
    }

    /**
     * @return array{latitude: float, longitude: float, heading: float, speed_mph: float, recorded_at: string}
     */
    protected function simulatedVehiclePosition(string $vehicleId, int $index, Carbon $now): array
    {
        $seed = crc32($vehicleId);
        $baseLat = 39.7817 + (($seed % 1000) / 100000) + ($index * 0.008);
        $baseLng = -89.6501 + ((($seed >> 8) % 1000) / 100000) - ($index * 0.006);
        $t = $now->timestamp / 20;
        $phase = ($seed % 360) * (M_PI / 180);

        return [
            'latitude' => round($baseLat + sin($t + $phase) * 0.015, 6),
            'longitude' => round($baseLng + cos($t + $phase) * 0.018, 6),
            'heading' => round(fmod(($t * 25 + $seed) * 180 / M_PI, 360), 1),
            'speed_mph' => round(12 + (abs(sin($t + $phase)) * 28), 1),
            'recorded_at' => $now->toIso8601String(),
        ];
    }

    /**
     * @param  array<int, array{latitude: float, longitude: float}>  $points
     * @return array{lat: float, lng: float}
     */
    protected function geoCenter(array $points, float $defaultLat = 39.7817, float $defaultLng = -89.6501): array
    {
        if ($points === []) {
            return ['lat' => $defaultLat, 'lng' => $defaultLng];
        }

        $lat = array_sum(array_column($points, 'latitude')) / count($points);
        $lng = array_sum(array_column($points, 'longitude')) / count($points);

        return ['lat' => round($lat, 6), 'lng' => round($lng, 6)];
    }
}
