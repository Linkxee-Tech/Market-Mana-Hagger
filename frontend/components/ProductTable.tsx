import { ProductDetection } from "../types/api";

interface ProductTableProps {
  products: ProductDetection[];
}

export function ProductTable({ products }: ProductTableProps) {
  return (
    <section className="card padded">
      <div className="header-row">
        <h3 className="title">Price Comparison</h3>
        <span className="badge">{products.length} found</span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Currency</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={3}>No products extracted yet.</td>
            </tr>
          ) : (
            products.map((product, index) => (
              <tr key={`${product.name}-${index}`}>
                <td>{product.name}</td>
                <td>{product.price.toLocaleString()}</td>
                <td>{product.currency}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
