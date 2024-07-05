import type { NextPage } from "next";
import { useRouter } from "next/router";

import { getPaginationParams } from "~/utils/pagination";
import { PaginatedListLayout } from "~/components/Layouts/PaginatedListLayout";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import { Card, CardContent, Grid, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import FileCopyIcon from '@mui/icons-material/FileCopy';
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
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#9370DB', fontWeight: 'bold'  }}>
                Public Key
              </Typography>
              <div style={{ display: 'flex', justifyContent: 'center', color:"#87CEFA" }}>
                <Typography style={{ lineHeight: '40px' }} >
                  {validator.validator.pubkey.substring(0, 12)}...
                </Typography>
                <CopyToClipboard text={validator.validator.pubkey}>
                  <IconButton>
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </CopyToClipboard>
              </div>
            </Grid>
            <Grid item xs={1}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#9370DB', fontWeight: 'bold'  }}>Index</Typography>
              <div style={{ display: 'flex', justifyContent: 'center', color:"#87CEFA" }}>
                <Typography style={{ lineHeight: '40px' }}>{validator.index}</Typography>
              </div>
            </Grid>
            <Grid item xs={2.5}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#9370DB', fontWeight: 'bold'  }}>Balance</Typography>
              <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>{ convertWei(validator.balance)} ETH ({convertWei(validator.validator.effective_balance)} ETH)</Typography>
            </Grid>
            <Grid item xs={1.5}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#9370DB', fontWeight: 'bold'  }}>State</Typography>
              <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px', color: validator.status.includes('active') ? '#00FA9A' : validator.status.includes('exited') ? 'red' : '' }}>
                {validator.status}
              </Typography>       
            </Grid>
            <Grid item xs={1.5}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#9370DB', fontWeight: 'bold'  }}>Activation</Typography>
              <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>Epoch {validator.validator.activation_epoch}</Typography>       
            </Grid>
            <Grid item xs={1.5}>
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#9370DB', fontWeight: 'bold'  }}>Exit</Typography>
                {
                  validator.validator.exit_epoch === "18446744073709551615" ?
                  <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>----</Typography> : 
                  <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>Epoch {validator.validator.exit_epoch}</Typography>  
                }     
            </Grid>
            <Grid item xs={1.5} >
              <Typography variant="h6" style={{ lineHeight: '60px' , display: 'flex', justifyContent: 'center', color: '#9370DB', fontWeight: 'bold'  }}>W/able</Typography>
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
              <div style={{ display: 'flex', justifyContent: 'center', color:"#87CEFA" }}>
                <Typography style={{ lineHeight: '40px' }} >
                  {validator.validator.pubkey.substring(0, 12)}...
                </Typography>
                <CopyToClipboard text={validator.validator.pubkey}>
                  <IconButton>
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </CopyToClipboard>
              </div>
            </Grid>
            <Grid item xs={1}>
              <div style={{ display: 'flex', justifyContent: 'center', color:"#87CEFA" }}>
                <Typography style={{ lineHeight: '40px' }}>{validator.index}</Typography>
              </div>
            </Grid>
            <Grid item xs={2.5}>
              <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>{ convertWei(validator.balance)} ETH ({convertWei(validator.validator.effective_balance)} ETH)</Typography>
            </Grid>
            <Grid item xs={1.5}>
            <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px', color: validator.status.includes('active') ? '#00FA9A' : validator.status.includes('exited') ? 'red' : '' }}>
                {validator.status}
              </Typography>       
            </Grid>
            <Grid item xs={1.5}>
              <Typography style={{ display: 'flex', justifyContent: 'center', lineHeight: '40px' }}>Epoch {validator.validator.activation_epoch}</Typography>       
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
