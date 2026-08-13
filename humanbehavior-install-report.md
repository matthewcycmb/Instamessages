# Human Behavior install report

The wizard installed Human Behavior into `.` using the detected framework `next.js`.

## Files changed

- `.gitignore`
- `app/HumanBehaviorInit.tsx`
- `app/layout.tsx`
- `package-lock.json`
- `package.json`

## Dependency & environment changes

- Runtime package: `humanbehavior-js@0.8.2`
- SDK init signature: `HumanBehaviorTracker.init(apiKey, options?)`
- Ingestion host: `https://ingest.humanbehavior.co`

### Environment operations

- `.env.local`: NEXT_PUBLIC_HUMANBEHAVIOR_API_KEY, NEXT_PUBLIC_HUMANBEHAVIOR_INGESTION_URL

## Checks

- completed: `npm exec tsc --noEmit`

## Placement notes

- Init landed outside the conventional client entrypoints for nextjs (app/**/providers.*, app/**/ClientProviders.*, app/**/*humanbehavior*, app/**/*human-behavior*, src/app/**/providers.*, src/app/**/*humanbehavior*, components/**, src/components/**, pages/_app.*, src/pages/_app.*, instrumentation-client.*, src/instrumentation-client.*). Not necessarily wrong, but worth a look.

## Next steps

- Restart the app/dev server so newly written environment variables are loaded (NEXT_PUBLIC_* and similar are baked at process start).
- Open your app locally and click around so the SDK can send events.
- In the Human Behavior dashboard, open the verify step and wait until first events show up: https://humanbehavior.co/projects/mso08jw8-64abba9d/get-started/sdk?step=verify
- Run a full production build before shipping (the wizard only typechecks/lints; it does not run `build`).

## Confidence

Accepted by the host-side install checks (wiring on disk). That is not proof events are flowing yet — restart the app and confirm the dashboard verify step.
