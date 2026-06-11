<?php

namespace App\Services;

use App\Models\AppDevice;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ExpoPushService
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    /**
     * @param  array{title: string, body: string, data?: array<string, mixed>}  $notification
     */
    public function sendToUser(User $user, array $notification): void
    {
        $tokens = AppDevice::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->pluck('device_token')
            ->filter(fn (string $token) => Str::startsWith($token, 'ExponentPushToken'))
            ->unique()
            ->values()
            ->all();

        if ($tokens === []) {
            return;
        }

        $this->send($tokens, $notification);
    }

    /**
     * @param  array<int, string>  $tokens
     * @param  array{title: string, body: string, data?: array<string, mixed>}  $notification
     */
    public function send(array $tokens, array $notification): void
    {
        $payload = array_map(fn (string $token) => [
            'to' => $token,
            'sound' => 'default',
            'title' => $notification['title'],
            'body' => $notification['body'],
            'data' => $notification['data'] ?? [],
            'priority' => 'high',
            'channelId' => 'messages',
        ], $tokens);

        foreach (array_chunk($payload, 100) as $chunk) {
            $this->dispatchChunk($chunk);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $messages
     */
    private function dispatchChunk(array $messages): void
    {
        try {
            $request = Http::acceptJson()->asJson();
            $accessToken = config('services.expo.access_token');

            if ($accessToken) {
                $request = $request->withToken($accessToken);
            }

            $response = $request->post(self::ENDPOINT, $messages);

            if (! $response->successful()) {
                Log::warning('Expo push request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return;
            }

            $this->handleTickets($response->json('data') ?? [], $messages);
        } catch (\Throwable $exception) {
            Log::warning('Expo push dispatch error', ['message' => $exception->getMessage()]);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $tickets
     * @param  array<int, array<string, mixed>>  $messages
     */
    private function handleTickets(array $tickets, array $messages): void
    {
        foreach ($tickets as $index => $ticket) {
            if (($ticket['status'] ?? '') !== 'error') {
                continue;
            }

            $error = $ticket['details']['error'] ?? null;
            if (! in_array($error, ['DeviceNotRegistered', 'InvalidCredentials'], true)) {
                continue;
            }

            $token = $messages[$index]['to'] ?? null;
            if (! is_string($token)) {
                continue;
            }

            AppDevice::query()
                ->where('device_token', $token)
                ->update(['is_active' => false]);
        }
    }
}
