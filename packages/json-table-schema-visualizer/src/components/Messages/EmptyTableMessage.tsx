import MessageWrapper from "./MessageWrapper";

import { t } from "@/i18n/t";

const EmptyTableMessage = () => {
  return (
    <MessageWrapper>
      <p className="text-center">{t("message.noTables")}</p>
    </MessageWrapper>
  );
};

export default EmptyTableMessage;
