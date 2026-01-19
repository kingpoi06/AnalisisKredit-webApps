const PageBackground = ({ children }) => (
  <div className="min-h-screen bg-[#f7f4ef] relative">
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-32 -right-28 h-64 w-64 rounded-full bg-[#f7c77a] opacity-40" />
      <div className="absolute top-40 -left-20 h-64 w-64 rounded-full bg-[#94d4d2] opacity-40" />
      <div className="absolute bottom-12 right-12 h-32 w-32 rounded-full bg-[#f2ad5c] opacity-30" />
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

export default PageBackground;
