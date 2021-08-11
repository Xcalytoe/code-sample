import {useState, useEffect, useContext} from 'react';
import PropTypes from 'prop-types';
import { makeStyles, useTheme } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline';
import Link from 'next/link';
import Product from '../../components/Product';
import Head from 'next/head'
import NavLayout from '../../components/NavLayout';
import Image from 'next/image';
import { filter, search } from '../../components/context/Action/searchAction';
import {GlobalContext} from '../../components/context/Provider';
import FilterSideBar from './FilterSideBar';
import { FILTER_LOADING, FILTER_SUCCESS, SEARCH_PARAM } from '../../components/context/actionsType/actiontypes';
import Skeleton from '../../components/Skeleton';
import {useRouter} from 'next/router';
import EmptyProductForm from '../../components/EmptyProductForm';
import { callApi, dispatchParamState, getSearchParams } from '../../utils';
import { orderBy, update } from 'lodash';
import Pagination from '../../components/Pagination'

const drawerWidth = 268;

const useStyles = makeStyles((theme) => ({
  root: {
      display: 'flex',

    },
    heading: {
      fontStyle: "normal",
      fontWeight: 600,
      fontSize: 14,
      lineHeight:" 21px",
      color: "#000000"
    },
drawer: {
  [theme.breakpoints.up('sm')]: {
    width: drawerWidth,
    flexShrink: 0,
  },
},
appBar: {
  [theme.breakpoints.up('sm')]: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  },
},
menuButton: {
  marginRight: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    display: 'none',
  },
},
// necessary for content to be below app bar
toolbar: theme.mixins.toolbar,
drawerPaper: {
  width: drawerWidth,
},
content: {
  flexGrow: 1,
  padding: theme.spacing(3),
},
}));
  
function ResponsiveDrawer( { window, products }) {
  const {searchState, searchDispatch, paramsState, paramsDispatch} = useContext(GlobalContext);
  // destructure global state 
  const {cars, loading, makeArry} = searchState;
  const router = useRouter();
  const { query } = router
  const classes = useStyles();
  // const theme = useTheme();
  const [sort, setSort] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchParams, setSearchParams] = useState([]);
  const [blockRouter, setBlockRouter]= useState(false);

  // const [noOfCars, setNoOfCars] = useState()
  const [pageNo, setPageNo] = useState(0)
 
  // useEffect 
  useEffect(() => {
    // on first loading, set products to global state
    if(products){
      searchDispatch({
        type:FILTER_SUCCESS,
        loading:false,
        payload: products
      })
    }
  }, [products]);

    // clear all search params state if there's no param in url 
  useEffect(() => {
      // get length of query in url 
    let qlength = Object.keys(router?.query).length;
    if(qlength === 0){
      setSearchParams([])
      dispatchParamState({financeable: false})(paramsDispatch)//update global state wich updates state on sidebar filter
    }
  }, [router?.query])

  useEffect(() => {
    if (query) {
      const gh = {...query}
      if (gh.page) delete gh.page

      const queryParams = Object.values(gh || {})
      const queryState = [];
      // convery the search params to Array
      if (queryParams.length) {
        for (const key in gh) {
          queryState.push({
             key : key,
            value : gh[key]
          })
        }
        // set the params to state 
        setSearchParams(queryState)
      }
    }
  }, [query])



  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleFilter = async (data) => {
    setBlockRouter(true)
    // if (blockRouter) return
    const newQuery = data.reduce((prev, curr) => ({...prev, [curr.key]: curr.value}), {})
    const {query: q, route} = getSearchParams(newQuery)
    router.push({
      pathname: '/buy',
      // query: {...route, page : 1}
      query: {...route}
    }, undefined, { shallow: true })
    // call filter function 
    callApi(q, searchDispatch)
  }

  // delete a search param 
  const deleteSearchParam = (param) => {
    let newParams = []

    if (param.key === 'make') {
      newParams = searchParams.filter(item => item.key !== "make" && item.key !== "model");
      dispatchParamState({make: "", model: ""})(paramsDispatch)
    } else {
      newParams = searchParams.filter(item => item.key !== param.key);
      dispatchParamState({[param.key]: ""})(paramsDispatch)
    }
    setSearchParams(newParams)
    handleFilter(newParams)
  }

   // delete all search params
  const deleteAllSearchParams = () => {
    dispatchParamState({
      make:"",
      model:"",
      grade: "",
      condition: "",
      transmission: "",
      minYear:"",
      maxYear:"",
      minPrice:"",
      maxPrice:"",
      type:"",
      financeable:false
    })(paramsDispatch)
    setSearchParams([])
    handleFilter([])
  }
  
  // set the total cars in state 
  useEffect(() => {
    if(cars !="Car not found" && cars?.length){
      const totalCars = parseInt(cars?.[(cars?.length) -1][0]?.total);
      const mainCars = cars?.filter(car => car?.make);
      const carsOnPage = mainCars?.length;
      // let pageNumber = Math.round(totalCars/carsOnPage)
      let pageNumber = Math.round(totalCars/50)
      setPageNo(pageNumber);
    }else{
      setPageNo(1);
    }
  
  }, [cars])
// sort filter 
  let product;
    if(cars !="Car not found" && cars?.length){
      const mainCars = cars.filter(car => car?.make)
      if (sort) {
        const [type, order] = sort.split('_')
        // console.log('type&order', type, order)
        if (type == '1') {
          // console.log('in price', type, order)
          product = orderBy(mainCars.map(i => ({...i, 'price': parseFloat(i.price)})), ['price'], [order]).map((item, index)=> {
            // console.log(item)
            return <Product key={item.sku} {...item}/>
          })
        } else {
          // console.log('in alphabet')
          product = orderBy(mainCars, ['year', 'make', 'model'], [order]).map((item, index)=>{
            return <Product key={item.sku} {...item}/>
          })
        }
      } else {
        product = mainCars.map((item, index)=>{
          return <Product key={item.sku} {...item}/>
        })
      }
     
    }else{
      product = <section className="filter_empty_product_container">
            <EmptyProductForm/>
          </section>
    }
          // console.log("paramsState",  paramsState)

    // intercept filter display name 
    const changeFilterDisplayName = (val)=>{
      switch (`${val}`) {
        case '1873':
          return 'suv';
        case '1765874':
          return 'mpv';
        case '1335875':
          return 'sedan';
        case '451876':
          return 'hatchback';
        case '18543277':
          return 'crossover';
        case '1873458':
          return 'coupe';
        case '1842479':
          return 'truck';
        case '1835670':
          return 'bus';
        case '13467881':
          return 'convertible';
        case '45661882':
            return 'pickup';
        case 'true':
          return 'financeable';
        default:
          break;
      }
    }
  // search count 
let searchLength;
// nav search returns -2 hence
 if(cars?.length - 2 < 0){
   searchLength = 0
}else{
  searchLength = cars?.length - 2;
}
  return (
    <>
      <Head>
        <title>Cars | Cars45</title>
        <link rel="icon" href="/favicon.ico" />

        <meta name="title" content="Cars45"/>
        <meta name="description" content="Get Verified &amp; Affordable Deals"/>
        <meta name="keywords" content="foreign used, used, nigerian used, imported cars, cars"/>

        <meta property="og:type" content="website"/>
        <meta property="og:url" content="https://www.cars45.com/buy"/>
        <meta property="og:title" content="Cars45"/>
        <meta property="og:description" content="Get Verified &amp; Affordable Deals "/>
        <meta property="og:image" content="/images/meta_image.webp"/>

        <meta property="twitter:card" content="summary_large_image"/>
        <meta property="twitter:url" content="https://www.cars45.com/buy"/>
        <meta property="twitter:title" content="Cars45"/>
        <meta property="twitter:description" content="Get Verified &amp; Affordable Deals"/>
        <meta property="twitter:image" content="/images/meta_image.webp"/>

      </Head>
      <div className="main_container">
        <div className={classes.root}>
          <CssBaseline />
               
          <nav className={classes.drawer} aria-label="mailbox folders">
              {/* sidebar  */}
              <FilterSideBar window={window} handleDrawerToggle={handleDrawerToggle} mobileOpen={mobileOpen} blockRouter={blockRouter} setBlockRouter={setBlockRouter} />
              {/* <FilterSideBar initialValues={initialValues} window={window} getMake={getMake} handleDrawerToggle={handleDrawerToggle} mobileOpen={mobileOpen}/> */}
          </nav>
          <main className={`catelogue_container ${classes.content}`}>
            {/* <div className={classes.toolbar} /> */}
            <div className="filter_main">
              <div className="filter_nav">
                  <nav className="flex">
                      <Link href="/">
                          <a>Home</a>
                      </Link>

                      <span>/ Featured Cars</span>

                  </nav>
              </div>
              {loading ? 
                // loading skeleton
                <div className="skeleton_container flex">
                  <Skeleton/>
                </div>:
                <>
                <div className="filters">
                {/* shows on desktop alone  */}
                  <div className="desktop_filter sub_nav flex wrap">
                    <div className="flex wrap param_btn_container"><p>Showing {cars !="Car not found" && cars? searchLength: 0} result for ...</p>
                      {searchParams.map((param, index) => (
                    // <div className="flex">
                      
                      <div key={`param${index}`} className="param_container">
                        {param.key =='type' || param.key =='financeable' ?
                        <><button onClick={e=>deleteSearchParam(param)}><span>{changeFilterDisplayName(param.value)}</span> x</button></>:
                        // <><button onClick={e=>deleteSearchParam(param)}><span>{changeFilterDisplayName(parseInt(param.value))}</span> x</button></>:
                          
                        <><button onClick={e=>deleteSearchParam(param)}><span>{param.value}</span> x</button></>}
                      </div>
                    // </div>changeFilterDisplayName
                    ))}
                      {searchParams.length > 1 ?
                      <div className="param_container"><button onClick={deleteAllSearchParams}><span>Clear all</span> X</button></div>:null}
                    </div>

                    <div className="sort_filter flex wrap">
                      <div className="flex sort_title">
                        <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.31257 10.2857H6.5626C6.44656 10.2857 6.33529 10.3309 6.25324 10.4112C6.17119 10.4916 6.1251 10.6006 6.1251 10.7143V11.5714C6.1251 11.6851 6.17119 11.7941 6.25324 11.8745C6.33529 11.9548 6.44656 12 6.5626 12H8.31257C8.4286 12 8.53988 11.9548 8.62193 11.8745C8.70397 11.7941 8.75007 11.6851 8.75007 11.5714V10.7143C8.75007 10.6006 8.70397 10.4916 8.62193 10.4112C8.53988 10.3309 8.4286 10.2857 8.31257 10.2857ZM0.437674 3.42857H1.75016V11.5714C1.75016 11.6851 1.79625 11.7941 1.8783 11.8745C1.96034 11.9548 2.07162 12 2.18765 12H3.06264C3.17867 12 3.28995 11.9548 3.372 11.8745C3.45404 11.7941 3.50013 11.6851 3.50013 11.5714V3.42857H4.81262C5.20117 3.42857 5.39722 2.96679 5.12187 2.69705L2.9344 0.125625C2.85236 0.045313 2.74113 0.000198637 2.62515 0.000198637C2.50916 0.000198637 2.39793 0.045313 2.31589 0.125625L0.12842 2.69705C-0.146108 2.96625 0.0485775 3.42857 0.437674 3.42857ZM11.8125 3.42857H6.5626C6.44656 3.42857 6.33529 3.47372 6.25324 3.5541C6.17119 3.63447 6.1251 3.74348 6.1251 3.85714V4.71429C6.1251 4.82795 6.17119 4.93696 6.25324 5.01733C6.33529 5.0977 6.44656 5.14286 6.5626 5.14286H11.8125C11.9286 5.14286 12.0398 5.0977 12.1219 5.01733C12.2039 4.93696 12.25 4.82795 12.25 4.71429V3.85714C12.25 3.74348 12.2039 3.63447 12.1219 3.5541C12.0398 3.47372 11.9286 3.42857 11.8125 3.42857ZM10.0625 6.85714H6.5626C6.44656 6.85714 6.33529 6.9023 6.25324 6.98267C6.17119 7.06304 6.1251 7.17205 6.1251 7.28571V8.14286C6.1251 8.25652 6.17119 8.36553 6.25324 8.4459C6.33529 8.52628 6.44656 8.57143 6.5626 8.57143H10.0625C10.1786 8.57143 10.2899 8.52628 10.3719 8.4459C10.454 8.36553 10.5 8.25652 10.5 8.14286V7.28571C10.5 7.17205 10.454 7.06304 10.3719 6.98267C10.2899 6.9023 10.1786 6.85714 10.0625 6.85714ZM13.5625 0H6.5626C6.44656 0 6.33529 0.0451529 6.25324 0.125526C6.17119 0.205898 6.1251 0.314907 6.1251 0.428571V1.28571C6.1251 1.39938 6.17119 1.50839 6.25324 1.58876C6.33529 1.66913 6.44656 1.71429 6.5626 1.71429H13.5625C13.6785 1.71429 13.7898 1.66913 13.8719 1.58876C13.9539 1.50839 14 1.39938 14 1.28571V0.428571C14 0.314907 13.9539 0.205898 13.8719 0.125526C13.7898 0.0451529 13.6785 0 13.5625 0Z" fill="#58B4AC"/>
                        </svg>
                        <span>Sort By:</span>
                      </div>
                      <select onChange={e=>setSort(e.target.value)}>
                        <option>Select Option</option>
                        <option value="0_asc">Name(A - Z)</option>
                        <option value="0_desc">Name(Z - A)</option>
                        <option value="1_desc">Price(High - Low)</option>
                        <option value="1_asc">Price(Low - High)</option>
                      </select>
                    </div>
                  </div>
                  {/* mobile filter  */}
                  <div className="mobile_filter sub_nav flex wrap">
                    <button onClick={handleDrawerToggle}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.57353 7.76471H3.08824V7.41177C3.08824 7.21765 2.94926 7.05882 2.77941 7.05882H2.16176C1.99191 7.05882 1.85294 7.21765 1.85294 7.41177V7.76471H0.308824C0.138971 7.76471 0 7.92353 0 8.11765V8.82353C0 9.01765 0.138971 9.17647 0.308824 9.17647H1.85294V9.52941C1.85294 9.72353 1.99191 9.88235 2.16176 9.88235H2.77941C2.94926 9.88235 3.08824 9.72353 3.08824 9.52941V9.17647H9.57353C9.74338 9.17647 9.88235 9.01765 9.88235 8.82353V8.11765C9.88235 7.92353 9.74338 7.76471 9.57353 7.76471ZM9.57353 4.23529H8.02941V3.88235C8.02941 3.68824 7.89044 3.52941 7.72059 3.52941H7.10294C6.93309 3.52941 6.79412 3.68824 6.79412 3.88235V4.23529H0.308824C0.138971 4.23529 0 4.39412 0 4.58824V5.29412C0 5.48824 0.138971 5.64706 0.308824 5.64706H6.79412V6C6.79412 6.19412 6.93309 6.35294 7.10294 6.35294H7.72059C7.89044 6.35294 8.02941 6.19412 8.02941 6V5.64706H9.57353C9.74338 5.64706 9.88235 5.48824 9.88235 5.29412V4.58824C9.88235 4.39412 9.74338 4.23529 9.57353 4.23529ZM9.57353 0.705882H5.55882V0.352941C5.55882 0.158824 5.41985 0 5.25 0H4.63235C4.4625 0 4.32353 0.158824 4.32353 0.352941V0.705882H0.308824C0.138971 0.705882 0 0.864706 0 1.05882V1.76471C0 1.95882 0.138971 2.11765 0.308824 2.11765H4.32353V2.47059C4.32353 2.66471 4.4625 2.82353 4.63235 2.82353H5.25C5.41985 2.82353 5.55882 2.66471 5.55882 2.47059V2.11765H9.57353C9.74338 2.11765 9.88235 1.95882 9.88235 1.76471V1.05882C9.88235 0.864706 9.74338 0.705882 9.57353 0.705882Z" fill="#58B4AC"/>
                      </svg>
                        Filter
                    </button>
                    <div className="sort_btn">
                      <select className="" onChange={e=>setSort(e.target.value)}>
                        <option>Sort By:</option>
                        <option value="0_asc">Name(A - Z)</option>
                        <option value="0_desc">Name(Z - A)</option>
                        <option value="1_desc">Price(High - Low)</option>
                        <option value="1_asc">Price(Low - High)</option>
                      </select>
                    </div>
                    {/* <button className="sort_btn">
                        Sort By: 
                        <span>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.68464 6.95012L1.1478 6.40592C0.920492 6.1755 0.927664 5.81026 1.1638 5.59134L6.04575 1.01413C6.28193 0.792811 6.65666 0.800171 6.88151 1.03055L11.5825 5.79594C11.8098 6.02636 11.8026 6.39161 11.5665 6.61053L11.0087 7.13323C10.77 7.3569 10.3879 7.34459 10.1632 7.10701L7.38985 4.15591L7.25423 11.0619C7.24795 11.3815 6.97911 11.6334 6.65122 11.627L5.8623 11.6115C5.5344 11.605 5.27566 11.3428 5.28193 11.0232L5.41755 4.11718L2.53045 6.95712C2.29654 7.1881 1.91432 7.1854 1.68464 6.95012Z" fill="#58B4AC"/>
                            </svg>
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.2632 4.67693L10.8224 5.22196C11.0592 5.45274 11.0592 5.82591 10.8224 6.05424L5.92821 10.8269C5.69144 11.0577 5.30856 11.0577 5.07431 10.8269L0.177582 6.05424C-0.059194 5.82346 -0.059194 5.45028 0.177582 5.22196L0.736776 4.67693C0.976071 4.4437 1.3665 4.44861 1.60076 4.68675L4.49244 7.64513V0.58922C4.49244 0.262694 4.76197 0 5.09698 0H5.90302C6.23804 0 6.50756 0.262694 6.50756 0.58922V7.64513L9.39924 4.68675C9.6335 4.44616 10.0239 4.44125 10.2632 4.67693Z" fill="#58B4AC"/>
                            </svg>

                        </span>
                    </button> */}
                    <div className="flex wrap param_btn_container"><p>Showing {cars !="Car not found" && cars? searchLength: 0} result for ...</p>
                      {searchParams.map((param, index) => (
                      // <div className="flex">
                        
                        <div key={`param${index}`} className="param_container">
                          {param.key =='type' || param.key =='financeable' ?
                          <><button onClick={e=>deleteSearchParam(param)}><span>{changeFilterDisplayName(param.value)}</span> x</button></>:
                          // <><button onClick={e=>deleteSearchParam(param)}><span>{changeFilterDisplayName(parseInt(param.value))}</span> x</button></>:
                          
                          <><button onClick={e=>deleteSearchParam(param)}><span>{param.value}</span> x</button></>}
                        </div>
                      // </div>changeFilterDisplayName
                      ))}
                      {searchParams.length > 1 ?
                      <div className="param_container"><button onClick={deleteAllSearchParams}><span>Clear all</span> X</button></div>:null}
                    </div>
                  </div>
                </div>
                            
                <div className="product_container grid">
                  {product}
                </div>
                  {pageNo >= 2 ?
                    <div  style={{textAlign:"center"}}>
                      <Pagination pageNo={pageNo} blockRouter={blockRouter} /> 
                    </div>: null}
                  
                  </>}
              </div>
                   
            </main>
          </div>
        </div>
      </>
    );
  }

ResponsiveDrawer.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window: PropTypes.func,
};
// export async function getStaticProps(context) {
export async function getStaticProps(context) {
  let res = await search('car/search');
  // let make = await search('make');
  let data = Object?.values(res?.data || []);
  if (!data) {
    return {
      notFound: true,
    }
  }

  return {
    props:{
      products: data,
      // getMake: make.data,
    },
    // revalidate:60

  }
}
export default ResponsiveDrawer;
ResponsiveDrawer.Layout = NavLayout;
