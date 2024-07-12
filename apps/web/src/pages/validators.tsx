import type { NextPage } from "next";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import { Card, CardContent, Grid, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {convertWei } from "~/utils";

const Validators: NextPage = function () {
  const router = useRouter();
  const { p, ps } = getPaginationParams(router.query);
  const {data: validators, error} = api.stats.getAllValidators.useQuery();
//   const { data: rawBlocksData, error } = api.block.getAll.useQuery({ p, ps });
  const validatorsCount = validators?.data.length;

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

return (
<PaginatedListLayout
  header={`Validators ${validatorsCount ? `(${validatorsCount})` : ""}`}
  items={validators?.data.map((validator, index) => (
    index === 0 ? (
      <Card key={validator.index}>
        <CardContent>
        <Grid container spacing={3}>
            <Grid item xs={2}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#143226', fontWeight: 'bold'  }}>
                Public Key
              </Typography>
              <div style={{ display: 'flex', justifyContent: 'center', color:"#17a2b8" }}>
                <Typography style={{ lineHeight: '40px' }} >
                  {validator.validator.pubkey.substring(0, 12)}...
                </Typography>
                <CopyToClipboard text={validator.validator.pubkey}>
                  <IconButton style={{ color:"#17a2b8" }}>
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </CopyToClipboard>
              </div>
            </Grid>
            <Grid item xs={1}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#143226', fontWeight: 'bold'  }}>Index</Typography>
              <div style={{ display: 'flex', justifyContent: 'center', color:"#17a2b8" }}>
                <Typography style={{ lineHeight: '40px' }}>{validator.index}</Typography>
              </div>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#143226', fontWeight: 'bold'  }}>Balance</Typography>
              <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>{ parseFloat(convertWei(validator.balance)).toFixed(4)} ETH ({convertWei(validator.validator.effective_balance)} ETH)</Typography>
            </Grid>
            <Grid item xs={1.5}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#143226', fontWeight: 'bold'  }}>State</Typography>
              <div style={{ display: 'flex', justifyContent: 'center'}}>
                <Typography style={{lineHeight: '40px'}}>{validator.status.charAt(0).toUpperCase() + validator.status.slice(1)}</Typography>
                {
                  validator.status.includes('active') ?
                    <IconButton style={{color: '#32CD32'}}>
                      <PowerSettingsNewIcon fontSize="small" />
                    </IconButton>  : 
                  validator.status.includes('exited') ?
                    <IconButton style={{color: '#f82e2e'}}>
                      <PowerSettingsNewIcon fontSize="small" />
                    </IconButton> : null
                 }
            </div>   
            </Grid>
            <Grid item xs={1.5}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#143226', fontWeight: 'bold'  }}>Activation</Typography>
                {
                  validator.validator.activation_epoch === "18446744073709551615" ?
                  <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>----</Typography> : 
                  <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>Epoch {validator.validator.activation_epoch}</Typography>       
                }
            </Grid>
            <Grid item xs={1.5}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#143226', fontWeight: 'bold'  }}>Exit</Typography>
                {
                  validator.validator.exit_epoch === "18446744073709551615" ?
                  <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>----</Typography> : 
                  <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>Epoch {validator.validator.exit_epoch}</Typography>  
                }     
            </Grid>
            <Grid item xs={1.5} >
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#143226', fontWeight: 'bold'  }}>W/able</Typography>
              {
                validator.validator.exit_epoch === "18446744073709551615" ?
                <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>----</Typography> :
                <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>Epoch {validator.validator.withdrawable_epoch}</Typography>  
              } 
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    ) :
    (
      <Card key={validator.index}>
        <CardContent >
        <Grid container spacing={3}>
            <Grid item xs={2}>
              <div style={{ display: 'flex', justifyContent: 'center', color:"#17a2b8" }}>
                <Typography style={{ lineHeight: '40px' }} >
                  {validator.validator.pubkey.substring(0, 12)}...
                </Typography>
                <CopyToClipboard text={validator.validator.pubkey}>
                  <IconButton style={{ color:"#17a2b8" }}>
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </CopyToClipboard>
              </div>
            </Grid>
            <Grid item xs={1}>
              <div style={{ display: 'flex', justifyContent: 'center', color:"#17a2b8" }}>
                <Typography style={{ lineHeight: '40px' }}>{validator.index}</Typography>
              </div>
            </Grid>
            <Grid item xs={2}>
              <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>{ parseFloat(convertWei(validator.balance)).toFixed(4)} ETH ({convertWei(validator.validator.effective_balance)} ETH)</Typography>
            </Grid>
            <Grid item xs={1.5}>
            <div style={{ display: 'flex', justifyContent: 'center'}}>
                <Typography style={{lineHeight: '40px'}}>{validator.status.charAt(0).toUpperCase() + validator.status.slice(1)}</Typography>
                {
                  validator.status.includes('active') ?
                    <IconButton style={{color: '#32CD32'}}>
                      <PowerSettingsNewIcon fontSize="small" />
                    </IconButton>  : 
                  validator.status.includes('exited') ?
                    <IconButton style={{color: '#f82e2e'}}>
                      <PowerSettingsNewIcon fontSize="small" />
                    </IconButton> : null
                 }
            </div>       
            </Grid>
            <Grid item xs={1.5}>
              {
                validator.validator.activation_epoch === "18446744073709551615" ?
                <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>----</Typography> : 
                <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>Epoch {validator.validator.activation_epoch}</Typography>       
              }
            </Grid>
            <Grid item xs={1.5}>
              {
                  validator.validator.exit_epoch === "18446744073709551615" ?
                  <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>----</Typography> : 
                  <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>Epoch {validator.validator.exit_epoch}</Typography>  
                }      
            </Grid>
            <Grid item xs={1.5} >
              {
                validator.validator.exit_epoch === "18446744073709551615" ?
                <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>----</Typography> :
                <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>Epoch {validator.validator.withdrawable_epoch}</Typography>  
              } 
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  ))}
  totalItems={validatorsCount}
  page={p}
  pageSize={ps}
  itemSkeleton={<Card />}
  emptyState="No blocks, please refresh your web page."
/>
);
};

export default Validators;
