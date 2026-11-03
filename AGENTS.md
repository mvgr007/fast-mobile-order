<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Demo state lives in a persisted zustand store (src/lib/store.ts) rehydrated client-side in __root; why: prototype without backend, avoids SSR hydration mismatch.
- Browser and React-boundary failures share a bounded diagnostic formatter that collects only error fields and redacts credentials; why: useful E901 logs without serializing private session/request data.
