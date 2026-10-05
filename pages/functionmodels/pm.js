import Link from "next/link";
import Layout from "../../components/Layout";
import FunctionModel from "../../components/FunctionModel";
import { pmFunctionModel } from "../../lib/functionModels/pm";

export default function PmFunctionModelPage() {
  return (
    <Layout
      title={pmFunctionModel.title}
      crumb={<><a href="https://davidfacer.com">davidfacer.com</a> / aimaturitymodels.com / <Link href="/functionmodels">Function Models</Link> / {pmFunctionModel.title}</>}
    >
      <FunctionModel data={pmFunctionModel} />
    </Layout>
  );
}
