const STEPS = [
  {
    title: "Share Screen",
    body: "Start a session and share your shopping page or upload a screenshot."
  },
  {
    title: "Mama Analyzes",
    body: "Vision + price intelligence finds the best visible offers and coupon hints."
  },
  {
    title: "Save Money",
    body: "Follow action highlights, apply bargains, and track your total savings live."
  }
];

export function HowItWorksSection() {
  return (
    <section className="card padded">
      <h2 className="title">How It Works</h2>
      <div className="steps">
        {STEPS.map((step) => (
          <article key={step.title} className="card padded step">
            <h3 className="title">{step.title}</h3>
            <p className="subtitle">{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
