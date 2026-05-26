import { ChevronDown, Star } from "lucide-react";
import { PanelHeader } from "../components/PanelHeader";
import { earnProducts } from "../data/mock";

export function EarnPage() {
  return (
    <section className="panel page-panel">
      <PanelHeader title="Earn Opportunity Screener" subtitle="APR, 이벤트 조건, 헤지 비용을 함께 비교" action="APR 높은 순" />
      <div className="toolbar">
        <button className="filter active" type="button">Flexible</button>
        <button className="filter" type="button">Futures 있음</button>
        <button className="filter" type="button">이벤트 APR</button>
        <button className="filter" type="button">구독 가능</button>
        <button className="filter right" type="button"><ChevronDown size={16} />최소 순APR 5%</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>토큰</th>
              <th>표시 APR</th>
              <th>기본 APR</th>
              <th>이벤트</th>
              <th>상태</th>
              <th>한도</th>
              <th>Futures</th>
              <th>예상 순APR</th>
            </tr>
          </thead>
          <tbody>
            {earnProducts.map((product) => (
              <tr key={product.symbol}>
                <td><span className="asset-symbol"><Star size={14} />{product.symbol}</span></td>
                <td className="apr">{product.apr}</td>
                <td>{product.baseApr}</td>
                <td>{product.event}</td>
                <td><span className="badge">{product.status}</span></td>
                <td>{product.quota}</td>
                <td>{product.futures}</td>
                <td className="net-apr">{product.netApr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
