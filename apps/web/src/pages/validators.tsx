import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { Card, CardContent, Grid, Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { getPaginationParams } from "~/utils/pagination";
import { ValidatorsPaginatedListLayout } from "~/components/Layouts/ValidatorsPaginatedListLayout";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import { buildValidatorRoute, convertWei } from "~/utils";



const Validators: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);
  const pubkey = router.query.pubkey as string | undefined;
  const { data: validators, error } = api.stats.getAllValidators.useQuery({
    page: p,
    limit: ps,
    pubkey: pubkey,
  });
  
  // const validatorsCount = validators?.data.length;
  const validatorsCount = validators?.totalNum;

  const validatorsShow = pubkey
    ? validators?.data.filter((validator) =>
        validator.validator.pubkey.includes(pubkey)
      )
    // : validators?.data.slice((p - 1) * ps, p * ps);
    : validators?.data;

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <ValidatorsPaginatedListLayout
      header={`Validators ${validatorsCount ? `(${validatorsCount})` : ""}`}
      items={validatorsShow?.map((validator, index) =>
        index === 0 ? (
          <Card key={validator.index}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={1}>
                  <Typography
                    variant="h6"
                    style={{
                      lineHeight: "60px",
                      display: "flex",
                      justifyContent: "center",
                      color: "#143226",
                      fontWeight: "bold",
                    }}
                  >
                    Index
                  </Typography>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                    className="text-accent-light dark:text-accent-dark"
                  >
                    <Link href={buildValidatorRoute(validator.index)}>
                      <Typography style={{ lineHeight: "40px" }}>
                        {validator.index}
                      </Typography>
                    </Link>
                  </div>
                </Grid>
                <Grid item xs={2}>
                  <Typography
                    variant="h6"
                    style={{
                      lineHeight: "60px",
                      display: "flex",
                      justifyContent: "center",
                      color: "#143226",
                      fontWeight: "bold",
                    }}
                  >
                    Public Key
                  </Typography>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                    className="text-accent-light dark:text-accent-dark"
                  >
                    <Link href={buildValidatorRoute(validator.index)}>
                      <Typography style={{ lineHeight: "40px" }}>
                        {validator.validator.pubkey.substring(0, 12)}...
                      </Typography>
                    </Link>
                    <CopyToClipboard text={validator.validator.pubkey}>
                      <IconButton style={{ color: "#6541EF" }}>
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </CopyToClipboard>
                  </div>
                </Grid>
                <Grid item xs={2.5}>
                  <Typography
                    variant="h6"
                    style={{
                      lineHeight: "60px",
                      display: "flex",
                      justifyContent: "center",
                      color: "#143226",
                      fontWeight: "bold",
                    }}
                  >
                    Balance
                  </Typography>
                  <Typography
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      lineHeight: "40px",
                    }}
                  >
                    {parseFloat(convertWei(validator.balance)).toFixed(4)} DILL
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography
                    variant="h6"
                    style={{
                      lineHeight: "60px",
                      display: "flex",
                      justifyContent: "center",
                      color: "#143226",
                      fontWeight: "bold",
                    }}
                  >
                    Withdrawal
                  </Typography>
                  <Typography
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        lineHeight: "40px",
                      }}
                    >
                      {validator.withdrawal_amount === "----"
                      ? "----"
                      : (parseFloat(convertWei(validator.withdrawal_amount))).toFixed(4) + " DILL"}
                  </Typography>
                </Grid>
                <Grid item xs={1.5}>
                  <Typography
                    variant="h6"
                    style={{
                      lineHeight: "60px",
                      display: "flex",
                      justifyContent: "center",
                      color: "#143226",
                      fontWeight: "bold",
                    }}
                  >
                    State
                  </Typography>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Typography style={{ lineHeight: "40px" }}>
                      {validator.status.charAt(0).toUpperCase() +
                        validator.status.slice(1)}
                    </Typography>
                    {validator.status.includes("active") ? (
                      <IconButton style={{ color: "#32CD32" }}>
                        <PowerSettingsNewIcon fontSize="small" />
                      </IconButton>
                    ) : validator.status.includes("exited") ? (
                      <IconButton style={{ color: "#f82e2e" }}>
                        <PowerSettingsNewIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </div>
                </Grid>
                <Grid item xs={1.5}>
                  <Typography
                    variant="h6"
                    style={{
                      lineHeight: "60px",
                      display: "flex",
                      justifyContent: "center",
                      color: "#143226",
                      fontWeight: "bold",
                    }}
                  >
                    Activation
                  </Typography>
                  {validator.validator.activation_epoch ===
                  "18446744073709551615" ? (
                    <Typography
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        lineHeight: "40px",
                      }}
                    >
                      ----
                    </Typography>
                  ) : (
                    <Typography
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        lineHeight: "40px",
                      }}
                    >
                      Epoch {validator.validator.activation_epoch}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={1.5}>
                  <Typography
                    variant="h6"
                    style={{
                      lineHeight: "60px",
                      display: "flex",
                      justifyContent: "center",
                      color: "#143226",
                      fontWeight: "bold",
                    }}
                  >
                    Exit
                  </Typography>
                  {validator.validator.exit_epoch === "18446744073709551615" ? (
                    <Typography
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        lineHeight: "40px",
                      }}
                    >
                      ----
                    </Typography>
                  ) : (
                    <Typography
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        lineHeight: "40px",
                      }}
                    >
                      Epoch {validator.validator.exit_epoch}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ) : (
          <Card key={validator.index}>
            <CardContent>
              <Grid container spacing={3}>
              <Grid item xs={1}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                    className="text-accent-light dark:text-accent-dark"
                  >
                    <Link href={buildValidatorRoute(validator.index)}>
                      <Typography style={{ lineHeight: "40px" }}>
                        {validator.index}
                      </Typography>
                    </Link>
                  </div>
                </Grid>
                <Grid item xs={2}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                    className="text-accent-light dark:text-accent-dark"
                  >
                    <Link href={buildValidatorRoute(validator.index)}>
                      <Typography style={{ lineHeight: "40px" }}>
                        {validator.validator.pubkey.substring(0, 12)}...
                      </Typography>
                    </Link>
                    <CopyToClipboard text={validator.validator.pubkey}>
                      <IconButton style={{ color: "#6541EF" }}>
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </CopyToClipboard>
                  </div>
                </Grid>
                <Grid item xs={2.5}>
                  <Typography
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      lineHeight: "40px",
                    }}
                  >
                    {parseFloat(convertWei(validator.balance)).toFixed(4)} DILL
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        lineHeight: "40px",
                      }}
                    >
                      {validator.withdrawal_amount === "----"
                      ? "----"
                      : (parseFloat(convertWei(validator.withdrawal_amount))).toFixed(4) + " DILL"}
                  </Typography>
                </Grid>
                <Grid item xs={1.5}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Typography style={{ lineHeight: "40px" }}>
                      {validator.status.charAt(0).toUpperCase() +
                        validator.status.slice(1)}
                    </Typography>
                    {validator.status.includes("active") ? (
                      <IconButton style={{ color: "#32CD32" }}>
                        <PowerSettingsNewIcon fontSize="small" />
                      </IconButton>
                    ) : validator.status.includes("exited") ? (
                      <IconButton style={{ color: "#f82e2e" }}>
                        <PowerSettingsNewIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </div>
                </Grid>
                <Grid item xs={1.5}>
                  {validator.validator.activation_epoch ===
                  "18446744073709551615" ? (
                    <Typography
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        lineHeight: "40px",
                      }}
                    >
                      ----
                    </Typography>
                  ) : (
                    <Typography
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        lineHeight: "40px",
                      }}
                    >
                      Epoch {validator.validator.activation_epoch}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={1.5}>
                  {validator.validator.exit_epoch === "18446744073709551615" ? (
                    <Typography
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        lineHeight: "40px",
                      }}
                    >
                      ----
                    </Typography>
                  ) : (
                    <Typography
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        lineHeight: "40px",
                      }}
                    >
                      Epoch {validator.validator.exit_epoch}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )
      )}
      totalItems={validatorsCount}
      page={p}
      pageSize={ps}
      itemSkeleton={<Card />}
      emptyState="No validators, please refresh your web page."
    />
  );
};

export default Validators;
