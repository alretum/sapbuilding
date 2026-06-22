// Fontsource packages are imported for their side effects (they inject @font-face
// CSS) and don't ship type declarations for the bare specifier. TS 6 flags such
// side-effect imports without declarations, so declare them here.
declare module "@fontsource-variable/nunito";
declare module "@fontsource-variable/fredoka";
