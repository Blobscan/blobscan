import { Spinner } from "./Spinner";

type PageSpinnerProps = {
  label?: string;
};

export const PageSpinner: React.FC<PageSpinnerProps> = ({ label = "" }) => {
  return (
    <div className="mt-52 flex h-48 items-center justify-center">
      <Spinner label={label} />
    </div>
  );
};
