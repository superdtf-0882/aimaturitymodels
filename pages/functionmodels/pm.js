import Link from "next/link";
import Layout from "../../components/Layout";
import FunctionModel from "../../components/FunctionModel";
import { pmFunctionModel } from "../../lib/functionModels/pm";

export default function PmFunctionModelPage() {
  return (
    <Layout
      title={pmFunctionModel.title}
      crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / <Link href="/functionmodels">Function Models</Link> / {pmFunctionModel.title}</>}
      wide
    >
      <FunctionModel data={pmFunctionModel} />
    </Layout>
  );
}
