import Link from "next/link";
import Layout from "../../components/Layout";
import FunctionModel from "../../components/FunctionModel";
import { productMarketingFunctionModel } from "../../lib/functionModels/productMarketing";

export default function ProductMarketingFunctionModelPage() {
  return (
    <Layout
      title={productMarketingFunctionModel.title}
      crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / <Link href="/functionmodels">Function Models</Link> / {productMarketingFunctionModel.title}</>}
    >
      <FunctionModel data={productMarketingFunctionModel} />
    </Layout>
  );
}
