import MessageWrapper from "./MessageWrapper";

import { t } from "@/i18n/t";

const NoSchemaMessage = () => {
  return (
    <MessageWrapper>
      <p>{t("message.noSchema")}</p>
    </MessageWrapper>
  );
};

export default NoSchemaMessage;
