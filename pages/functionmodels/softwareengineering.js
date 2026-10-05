import Link from "next/link";
import Layout from "../../components/Layout";
import FunctionModel from "../../components/FunctionModel";
import { softwareEngineeringFunctionModel } from "../../lib/functionModels/softwareEngineering";

export default function SoftwareEngineeringFunctionModelPage() {
  return (
    <Layout
      title={softwareEngineeringFunctionModel.title}
      crumb={<><a href="https://davidfacer.com">davidfacer.com</a> / aimaturitymodels.com / <Link href="/functionmodels">Function Models</Link> / {softwareEngineeringFunctionModel.title}</>}
    >
      <FunctionModel data={softwareEngineeringFunctionModel} />
    </Layout>
  );
}
